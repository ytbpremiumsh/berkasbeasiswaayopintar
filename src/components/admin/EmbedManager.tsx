import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Copy, Code, ExternalLink, Trophy, Heart, Wallet, Globe, Search } from "lucide-react";

const categories = [
  { key: "prestasi", label: "Beasiswa Prestasi", icon: Trophy, color: "from-amber-500 to-orange-500" },
  { key: "yatim", label: "Beasiswa Yatim", icon: Heart, color: "from-rose-500 to-pink-500" },
  { key: "ekonomi", label: "Beasiswa Ekonomi", icon: Wallet, color: "from-emerald-500 to-teal-500" },
  { key: "umum", label: "Beasiswa Umum", icon: Globe, color: "from-blue-500 to-indigo-500" },
];

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast({ title: "Disalin!", description: `${label} telah disalin ke clipboard` });
};

function EmbedCodeTabs({
  getIframeCode,
  getScriptCode,
  getDirectLink,
  previewSrc,
  previewLabel,
}: {
  getIframeCode: () => string;
  getScriptCode: () => string;
  getDirectLink: () => string;
  previewSrc: string;
  previewLabel: string;
}) {
  return (
    <>
      <Tabs defaultValue="iframe">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="iframe">iFrame</TabsTrigger>
          <TabsTrigger value="script">Script</TabsTrigger>
          <TabsTrigger value="link">Direct Link</TabsTrigger>
        </TabsList>

        <TabsContent value="iframe">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="w-5 h-5" /> Kode iFrame
                  </CardTitle>
                  <CardDescription>Salin dan tempel kode ini ke HTML website Anda</CardDescription>
                </div>
                <Button size="sm" onClick={() => copyToClipboard(getIframeCode(), "Kode iFrame")}>
                  <Copy className="w-4 h-4 mr-1" /> Salin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {getIframeCode()}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="w-5 h-5" /> Kode Script
                  </CardTitle>
                  <CardDescription>Gunakan script ini untuk embed yang lebih fleksibel</CardDescription>
                </div>
                <Button size="sm" onClick={() => copyToClipboard(getScriptCode(), "Kode Script")}>
                  <Copy className="w-4 h-4 mr-1" /> Salin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all font-mono">
                {getScriptCode()}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" /> Direct Link
                  </CardTitle>
                  <CardDescription>Link langsung ke halaman</CardDescription>
                </div>
                <Button size="sm" onClick={() => copyToClipboard(getDirectLink(), "Link")}>
                  <Copy className="w-4 h-4 mr-1" /> Salin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <a href={getDirectLink()} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                  {getDirectLink()}
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Tampilan {previewLabel} saat di-embed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={previewSrc}
              width="100%"
              height="600px"
              frameBorder="0"
              style={{ border: "none" }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function EmbedManager() {
  const [embedType, setEmbedType] = useState<"form" | "cek-status">("form");
  const [selectedCategory, setSelectedCategory] = useState("prestasi");
  const [iframeWidth, setIframeWidth] = useState("100%");
  const [iframeHeight, setIframeHeight] = useState("800");

  const baseUrl = window.location.origin;

  const getFormIframeCode = () =>
    `<iframe src="${baseUrl}/beasiswa/${selectedCategory}?embed=true" width="${iframeWidth}" height="${iframeHeight}px" frameborder="0" style="border:none;border-radius:8px;" allowfullscreen></iframe>`;

  const getFormScriptCode = () =>
    `<div id="berkas-beasiswa-${selectedCategory}"></div>
<script>
(function() {
  var container = document.getElementById('berkas-beasiswa-${selectedCategory}');
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/beasiswa/${selectedCategory}?embed=true';
  iframe.width = '${iframeWidth}';
  iframe.height = '${iframeHeight}px';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.maxWidth = '100%';
  iframe.allowFullscreen = true;
  container.appendChild(iframe);
})();
</script>`;

  const getFormDirectLink = () => `${baseUrl}/beasiswa/${selectedCategory}`;

  const getCekStatusIframeCode = () =>
    `<iframe src="${baseUrl}/cek-status?embed=true" width="${iframeWidth}" height="${iframeHeight}px" frameborder="0" style="border:none;border-radius:8px;" allowfullscreen></iframe>`;

  const getCekStatusScriptCode = () =>
    `<div id="berkas-cek-status"></div>
<script>
(function() {
  var container = document.getElementById('berkas-cek-status');
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/cek-status?embed=true';
  iframe.width = '${iframeWidth}';
  iframe.height = '${iframeHeight}px';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '8px';
  iframe.style.maxWidth = '100%';
  iframe.allowFullscreen = true;
  container.appendChild(iframe);
})();
</script>`;

  const getCekStatusDirectLink = () => `${baseUrl}/cek-status`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Embed Form</h1>
        <p className="text-muted-foreground">Dapatkan kode embed untuk memasukkan form atau cek status ke website lain</p>
      </div>

      {/* Embed Type Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setEmbedType("form")}
          className={`p-4 rounded-xl transition-all duration-200 text-left ${
            embedType === "form"
              ? "bg-card shadow-lg ring-2 ring-primary"
              : "bg-card/50 hover:bg-card hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-500">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-medium block">Form Beasiswa</span>
              <span className="text-xs text-muted-foreground">Embed form pengiriman berkas</span>
            </div>
          </div>
        </button>
        <button
          onClick={() => setEmbedType("cek-status")}
          className={`p-4 rounded-xl transition-all duration-200 text-left ${
            embedType === "cek-status"
              ? "bg-card shadow-lg ring-2 ring-primary"
              : "bg-card/50 hover:bg-card hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-500">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-medium block">Cek Status</span>
              <span className="text-xs text-muted-foreground">Embed halaman cek status</span>
            </div>
          </div>
        </button>
      </div>

      {/* Category Selection - only for form */}
      {embedType === "form" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`p-4 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? "bg-card shadow-lg ring-2 ring-primary"
                    : "bg-card/50 hover:bg-card hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{cat.label.replace("Beasiswa ", "")}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengaturan Ukuran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Lebar</Label>
              <Input value={iframeWidth} onChange={(e) => setIframeWidth(e.target.value)} placeholder="100%" />
            </div>
            <div className="flex-1">
              <Label>Tinggi (px)</Label>
              <Input value={iframeHeight} onChange={(e) => setIframeHeight(e.target.value)} placeholder="800" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed Codes */}
      {embedType === "form" ? (
        <EmbedCodeTabs
          getIframeCode={getFormIframeCode}
          getScriptCode={getFormScriptCode}
          getDirectLink={getFormDirectLink}
          previewSrc={`${baseUrl}/beasiswa/${selectedCategory}?embed=true`}
          previewLabel={`form ${categories.find(c => c.key === selectedCategory)?.label}`}
        />
      ) : (
        <EmbedCodeTabs
          getIframeCode={getCekStatusIframeCode}
          getScriptCode={getCekStatusScriptCode}
          getDirectLink={getCekStatusDirectLink}
          previewSrc={`${baseUrl}/cek-status?embed=true`}
          previewLabel="Cek Status Administrasi"
        />
      )}
    </div>
  );
}