import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  MapPin,
  Users,
  Calendar,
  HandshakeIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import type { Contact, Company, Deal } from "@shared/schema";

export default function CompanyProfile() {
  const [, params] = useRoute("/companies/:id");
  const companyId = params?.id;

  const { data: company, isLoading: companyLoading } = useQuery<Company>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId,
  });

  const { data: allContacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const { data: allDeals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Company not found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/companies">Back to Companies</Link>
          </Button>
        </div>
      </div>
    );
  }

  const contacts = allContacts.filter(c => c.companyId === companyId);
  const deals = allDeals.filter(d => d.companyId === companyId);
  const totalDealValue = deals.reduce((sum, d) => sum + parseFloat(d.value), 0);

  const initials = company.name.split(' ').slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/companies" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">Company Profile</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold" data-testid="text-company-name">
                  {company.name}
                </h2>
                {company.industry && (
                  <Badge variant="secondary" className="mt-2">{company.industry}</Badge>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                {company.domain && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a 
                        href={company.domain.startsWith('http') ? company.domain : `https://${company.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {company.domain}
                      </a>
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a href={`tel:${company.phone}`} className="text-sm hover:underline">
                        {company.phone}
                      </a>
                    </div>
                  </div>
                )}

                {company.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm">{company.address}</p>
                    </div>
                  </div>
                )}

                {company.size && (
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Company Size</p>
                      <p className="text-sm">{company.size} employees</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Added</p>
                    <p className="text-sm">{format(new Date(company.createdAt), "PPP")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{contacts.length}</p>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{deals.length}</p>
                  <p className="text-xs text-muted-foreground">Deals</p>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="text-center">
                <p className="text-xl font-bold">RM {totalDealValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Deal Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Contacts</CardTitle>
              </div>
              <CardDescription>
                {contacts.length} contact{contacts.length !== 1 ? 's' : ''} at this company
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No contacts yet</p>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <Link key={contact.id} href={`/contacts/${contact.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-md border hover-elevate cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted">
                              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                            <p className="text-sm text-muted-foreground">{contact.jobTitle || contact.email}</p>
                          </div>
                        </div>
                        <StatusBadge status={contact.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HandshakeIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Deals</CardTitle>
              </div>
              <CardDescription>
                {deals.length} deal{deals.length !== 1 ? 's' : ''} with this company
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No deals yet</p>
              ) : (
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 rounded-md border">
                      <div>
                        <p className="font-medium">{deal.name}</p>
                        <p className="text-sm text-muted-foreground">
                          RM {parseFloat(deal.value).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{deal.stage}</Badge>
                        {deal.probability !== null && (
                          <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
