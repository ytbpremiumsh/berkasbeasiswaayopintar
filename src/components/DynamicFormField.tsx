import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/FileUpload";

interface DynamicFormFieldProps {
  fieldName: string;
  label: string;
  fieldType: string;
  required: boolean;
  description?: string | null;
  value: string;
  onChange: (value: string) => void;
  uploadFolder?: string;
}

export function DynamicFormField({
  fieldName,
  label,
  fieldType,
  required,
  description,
  value,
  onChange,
  uploadFolder,
}: DynamicFormFieldProps) {
  const renderField = () => {
    switch (fieldType) {
      case "text":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive"> *</span>}
            </label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            <Input
              placeholder={`Masukkan ${label.toLowerCase()}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive"> *</span>}
            </label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            <Textarea
              placeholder={`Masukkan ${label.toLowerCase()}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[150px]"
            />
            {fieldName === "essay" && (
              <p className="text-xs text-muted-foreground">
                {value.split(/\s+/).filter(Boolean).length}/500 kata
              </p>
            )}
          </div>
        );

      case "url":
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive"> *</span>}
            </label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            <Input
              type="url"
              placeholder="https://..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );

      case "file":
      default:
        return (
          <FileUpload
            label={label}
            required={required}
            description={description || undefined}
            folder={uploadFolder || "uploads"}
            value={value}
            onUpload={onChange}
          />
        );
    }
  };

  return renderField();
}
