import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Video, Play } from "lucide-react";

interface VideoUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export function VideoUpload({ value, onChange, label = "Profile Video" }: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setError("Please select a video file (MP4, WebM, or MOV)");
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError("Video must be less than 100MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL, objectPath } = await response.json();

      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      onChange(objectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const hasVideo = value && value.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-muted-foreground">{label} (Optional)</label>
      
      {hasVideo ? (
        <div className="relative rounded-md overflow-hidden border bg-muted">
          <video
            src={value}
            controls
            className="w-full max-h-48 object-contain"
            data-testid="video-preview"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 rounded-md border border-dashed bg-muted/50">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Video className="h-8 w-8" />
            <span className="text-xs">No video uploaded</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-upload-video"
        >
          <Upload className="h-4 w-4 mr-1" />
          {isUploading ? "Uploading..." : hasVideo ? "Change Video" : "Upload Video"}
        </Button>

        {hasVideo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            data-testid="button-remove-video"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-video-upload"
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
