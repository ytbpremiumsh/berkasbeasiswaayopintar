import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Copy, Code, ExternalLink, Trophy, Heart, Wallet, Globe } from "lucide-react";

const categories = [
  { key: "prestasi", label: "Prestasi", icon: Trophy, color: "from-amber-500 to-orange-500" },
  { key: "yatim", label: "Yatim", icon: Heart, color: "from-rose-500 to-pink-500" },
  { key: "ekonomi", label: "Ekonomi", icon: Wallet, color: "from-emerald-500 to-teal-500" },
  { key: "umum", label: "Umum", icon: Globe, color: "from-blue-500 to-indigo-500" },
];

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast({ title: "Disalin!", description: `${label} telah disalin ke clipboard` });
};

export function RegistrationEmbedManager() {
  const [selectedCategory, setSelectedCategory] = useState("prestasi");
  const [iframeWidth, setIframeWidth] = useState("100%");
  const [iframeHeight, setIframeHeight] = useState("800");

  const baseUrl = window.location.origin;

  const getIframeCode = () =>
    `<iframe src="${baseUrl}/daftar/${selectedCategory}?embed=true" width="${iframeWidth}" height="${iframeHeight}px" frameborder="0" style="border:none;border-radius:8px;" allowfullscreen></iframe>`;

  const getScriptCode = () =>
    `<div id="pendaftaran-${selectedCategory}"></div>
<script>
(function() {
  var container = document.getElementById('pendaftaran-${selectedCategory}');
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/daftar/${selectedCategory}?embed=true';
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

  const getDirectLink = () => `${baseUrl}/daftar/${selectedCategory}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Embed Pendaftaran</h1>
        <p className="text-muted-foreground">Dapatkan kode embed untuk form pendaftaran</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.key;
          return (
            <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
              className={`p-4 rounded-xl transition-all duration-200 text-left ${
                isActive ? "bg-card shadow-lg ring-2 ring-primary" : "bg-card/50 hover:bg-card hover:shadow-md"
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${cat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{cat.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Pengaturan Ukuran</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Lebar</Label>
              <Input value={iframeWidth} onChange={(e) => setIframeWidth(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Tinggi (px)</Label>
              <Input value={iframeHeight} onChange={(e) => setIframeHeight(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

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
                <div><CardTitle className="text-lg"><Code className="w-5 h-5 inline mr-2" />Kode iFrame</CardTitle></div>
                <Button size="sm" onClick={() => copyToClipboard(getIframeCode(), "Kode iFrame")}><Copy className="w-4 h-4 mr-1" /> Salin</Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all font-mono">{getIframeCode()}</pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="script">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-lg"><Code className="w-5 h-5 inline mr-2" />Kode Script</CardTitle></div>
                <Button size="sm" onClick={() => copyToClipboard(getScriptCode(), "Kode Script")}><Copy className="w-4 h-4 mr-1" /> Salin</Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all font-mono">{getScriptCode()}</pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="link">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-lg"><ExternalLink className="w-5 h-5 inline mr-2" />Direct Link</CardTitle></div>
                <Button size="sm" onClick={() => copyToClipboard(getDirectLink(), "Link")}><Copy className="w-4 h-4 mr-1" /> Salin</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <a href={getDirectLink()} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{getDirectLink()}</a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Tampilan form pendaftaran {categories.find(c => c.key === selectedCategory)?.label}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <iframe src={`${baseUrl}/daftar/${selectedCategory}?embed=true`} width="100%" height="600px" frameBorder="0" style={{ border: "none" }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
