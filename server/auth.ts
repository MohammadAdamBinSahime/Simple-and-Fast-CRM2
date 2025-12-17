import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(
  supplied: string,
  stored: string
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function ensureAdminExists(): Promise<void> {
  const adminUsername = "admin";
  const adminPassword = "admin123";
  
  const existingAdmin = await storage.getUserByUsername(adminUsername);
  if (!existingAdmin) {
    const hashedPassword = await hashPassword(adminPassword);
    await storage.createUser({
      username: adminUsername,
      password: hashedPassword,
      role: "admin",
      subscriptionStatus: "subscribed",
    });
    console.log("Admin user created: username=admin, password=admin123");
  }
}

export function setupAuth(app: Express): void {
  const sessionSecret = process.env.SESSION_SECRET || "crm-session-secret-dev";

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Check if free trial has expired (older than 7 days and on free_trial)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const isExpired = user.subscriptionStatus === "free_trial" && 
                          new Date(user.createdAt) < sevenDaysAgo &&
                          user.role !== "admin";
        
        if (isExpired) {
          return done(null, false, { message: "Your free trial has expired. Please subscribe to continue." });
        }
        
        return done(null, { id: user.id, username: user.username, role: user.role });
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, { id: user.id, username: user.username, role: user.role });
    } catch (error) {
      done(error);
    }
  });

  ensureAdminExists().catch(console.error);

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword, role: "user" });

      await storage.createLoginActivity({
        userId: user.id,
        username: user.username,
        eventType: "register",
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
      });

      req.login({ id: user.id, username: user.username, role: user.role }, (err) => {
        if (err) return next(err);
        res.status(201).json({ id: user.id, username: user.username, role: user.role });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: info?.message || "Login failed" });
      }
      
      await storage.createLoginActivity({
        userId: user.id,
        username: user.username,
        eventType: "login",
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ id: user.id, username: user.username, role: user.role });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", async (req, res) => {
    if (req.user) {
      await storage.createLoginActivity({
        userId: req.user.id,
        username: req.user.username,
        eventType: "logout",
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
      });
    }
    
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const enrichedUsers = users.map(({ password, ...rest }) => {
        const isOlderThan7Days = new Date(rest.createdAt) < sevenDaysAgo;
        const isExpired = rest.subscriptionStatus === "free_trial" && 
                          isOlderThan7Days && 
                          rest.role !== "admin";
        return {
          ...rest,
          isOlderThan7Days,
          isExpired,
        };
      });
      res.json(enrichedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/activities", requireAdmin, async (req, res) => {
    try {
      const { eventType } = req.query;
      const activities = await storage.getLoginActivities(
        typeof eventType === "string" ? eventType : undefined
      );
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ error: "Admin access required" });
}
