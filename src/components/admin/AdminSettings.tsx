import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Key, User, Mail, FileText, Trophy, Megaphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AdminSettings() {
  const [mayarApiKey, setMayarApiKey] = useState("");
  const [mayarProductId, setMayarProductId] = useState("");
  const [checkStatusButtonText, setCheckStatusButtonText] = useState("Kirim Berkas Sekarang");
  const [checkStatusButtonLink, setCheckStatusButtonLink] = useState("/");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingButton, setIsSavingButton] = useState(false);
  const [peraihPageActive, setPeraihPageActive] = useState(false);
  const [administrationResultsPublished, setAdministrationResultsPublished] = useState(false);
  
  // Profile
  const [currentEmail, setCurrentEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .in("setting_key", ["mayar_api_key", "mayar_product_id", "check_status_button", "peraih_beasiswa_page", "administration_results_page"]);

      if (error) throw error;

      data?.forEach((item) => {
        const val = item.setting_value as any;
        if (item.setting_key === "mayar_api_key") setMayarApiKey(val?.value || "");
        if (item.setting_key === "mayar_product_id") setMayarProductId(val?.value || "");
        if (item.setting_key === "check_status_button") {
          setCheckStatusButtonText(val?.button_text || "Kirim Berkas Sekarang");
          setCheckStatusButtonLink(val?.button_link || "/");
        }
        if (item.setting_key === "peraih_beasiswa_page") {
          setPeraihPageActive(val?.is_active === true);
        }
        if (item.setting_key === "administration_results_page") {
          setAdministrationResultsPublished(val?.is_published === true);
        }
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentEmail(user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error: err1 } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: "mayar_api_key",
          setting_value: { value: mayarApiKey },
        }, { onConflict: "setting_key" });

      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from("admin_settings")
        .upsert({
          setting_key: "mayar_product_id",
          setting_value: { value: mayarProductId },
        }, { onConflict: "setting_key" });

      if (err2) throw err2;

      toast({ title: "Pengaturan Mayar berhasil disimpan" });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({ title: "Gagal menyimpan pengaturan", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", user.id);

      if (error) throw error;

      toast({ title: "Profil berhasil diperbarui" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Gagal memperbarui profil", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Password baru tidak cocok", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({ title: "Password berhasil diubah" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDialogOpen(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({ title: "Gagal mengubah password", description: error.message, variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola profil dan konfigurasi API</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Profil Admin</CardTitle>
              <CardDescription>Kelola informasi akun Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email
            </label>
            <Input value={currentEmail} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Lengkap</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap Anda"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nomor Telepon</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={updateProfile} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Simpan Profil
            </Button>

            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Key className="w-4 h-4 mr-2" />
                  Ubah Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ubah Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password Baru</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Konfirmasi Password Baru</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                    />
                  </div>
                  <Button onClick={changePassword} disabled={isChangingPassword} className="w-full">
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Ubah Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Mayar API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Mayar API</CardTitle>
          <CardDescription>Konfigurasi API Key Mayar untuk validasi token beasiswa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key Mayar</label>
            <Input
              type="password"
              placeholder="Masukkan API Key Mayar"
              value={mayarApiKey}
              onChange={(e) => setMayarApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">API Key ini digunakan untuk memvalidasi kode token dari Mayar</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">ID Produk Lisensi</label>
            <Input
              placeholder="Masukkan Product ID dari Mayar"
              value={mayarProductId}
              onChange={(e) => setMayarProductId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Product ID digunakan untuk verifikasi lisensi token beasiswa. Dapatkan dari dashboard Mayar.</p>
          </div>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Pengaturan Mayar
          </Button>
        </CardContent>
      </Card>

      {/* Check Status Button Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Tombol Cek Status</CardTitle>
              <CardDescription>Kustomisasi tombol "Kirim Berkas Sekarang" pada halaman Cek Status Administrasi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Teks Tombol</label>
            <Input
              placeholder="Kirim Berkas Sekarang"
              value={checkStatusButtonText}
              onChange={(e) => setCheckStatusButtonText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Link Tujuan Tombol</label>
            <Input
              placeholder="https://example.com atau /halaman"
              value={checkStatusButtonLink}
              onChange={(e) => setCheckStatusButtonLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Gunakan URL lengkap (https://...) untuk link eksternal atau path relatif (/) untuk halaman internal</p>
          </div>
          <Button onClick={async () => {
            setIsSavingButton(true);
            try {
              const { error } = await supabase
                .from("admin_settings")
                .upsert({
                  setting_key: "check_status_button",
                  setting_value: { button_text: checkStatusButtonText, button_link: checkStatusButtonLink },
                }, { onConflict: "setting_key" });
              if (error) throw error;
              toast({ title: "Pengaturan tombol berhasil disimpan" });
            } catch (error: any) {
              toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
            } finally {
              setIsSavingButton(false);
            }
          }} disabled={isSavingButton}>
            {isSavingButton ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Pengaturan Tombol
          </Button>
        </CardContent>
      </Card>
      {/* Peraih Beasiswa Page Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Pengumuman Lolos Administrasi</CardTitle>
              <CardDescription>Publikasikan peserta yang pengajuannya sudah berstatus diverifikasi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Publikasikan Pengumuman</p>
              <p className="text-xs text-muted-foreground">
                {administrationResultsPublished
                  ? "Daftar peserta lolos administrasi dapat dilihat oleh publik"
                  : "Daftar peserta masih disembunyikan dari publik"}
              </p>
            </div>
            <Switch
              checked={administrationResultsPublished}
              onCheckedChange={async (checked) => {
                setAdministrationResultsPublished(checked);
                try {
                  const { error } = await supabase
                    .from("admin_settings")
                    .upsert({
                      setting_key: "administration_results_page",
                      setting_value: { is_published: checked },
                    }, { onConflict: "setting_key" });
                  if (error) throw error;
                  toast({ title: checked ? "Pengumuman dipublikasikan" : "Pengumuman disembunyikan" });
                } catch (error: any) {
                  setAdministrationResultsPublished(!checked);
                  toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Peraih Beasiswa Page Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Halaman Peraih Beasiswa</CardTitle>
              <CardDescription>Aktifkan/nonaktifkan halaman publik daftar kandidat peraih beasiswa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status Halaman</p>
              <p className="text-xs text-muted-foreground">
                {peraihPageActive ? "Halaman aktif dan bisa diakses publik" : "Halaman nonaktif, pengunjung akan melihat pesan belum tersedia"}
              </p>
            </div>
            <Switch
              checked={peraihPageActive}
              onCheckedChange={async (checked) => {
                setPeraihPageActive(checked);
                try {
                  const { error } = await supabase
                    .from("admin_settings")
                    .upsert({
                      setting_key: "peraih_beasiswa_page",
                      setting_value: { is_active: checked },
                    }, { onConflict: "setting_key" });
                  if (error) throw error;
                  toast({ title: checked ? "Halaman diaktifkan" : "Halaman dinonaktifkan" });
                } catch (error: any) {
                  setPeraihPageActive(!checked);
                  toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
