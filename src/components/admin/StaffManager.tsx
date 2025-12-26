import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Key, UserX, UserCheck, Trash2, Loader2, Users, Shield, UserCog } from "lucide-react";

interface ManagedAccount {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "staff" | "user";
  is_active: boolean;
  created_at: string;
}

export function StaffManager() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ManagedAccount | null>(null);
  
  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("managed_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts((data as ManagedAccount[]) || []);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ title: "Gagal memuat data", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async () => {
    if (!newEmail || !newPassword) {
      toast({ title: "Error", description: "Email dan password wajib diisi", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("manage-accounts", {
        body: {
          action: "create",
          email: newEmail,
          password: newPassword,
          full_name: newFullName,
          role: newRole
        }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Berhasil", description: `Akun ${newRole} berhasil dibuat` });
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewRole("staff");
      setCreateDialogOpen(false);
      fetchAccounts();
    } catch (error: any) {
      console.error("Create error:", error);
      toast({ title: "Gagal membuat akun", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const updatePassword = async () => {
    if (!selectedAccount || !newPasswordInput) {
      toast({ title: "Error", description: "Password baru wajib diisi", variant: "destructive" });
      return;
    }

    if (newPasswordInput.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await supabase.functions.invoke("manage-accounts", {
        body: {
          action: "update-password",
          user_id: selectedAccount.user_id,
          password: newPasswordInput
        }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Berhasil", description: "Password berhasil diubah" });
      setNewPasswordInput("");
      setPasswordDialogOpen(false);
      setSelectedAccount(null);
    } catch (error: any) {
      console.error("Update password error:", error);
      toast({ title: "Gagal mengubah password", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const toggleStatus = async (account: ManagedAccount) => {
    try {
      const response = await supabase.functions.invoke("manage-accounts", {
        body: {
          action: "update-status",
          user_id: account.user_id,
          is_active: !account.is_active
        }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ 
        title: "Berhasil", 
        description: account.is_active ? "Akun dinonaktifkan" : "Akun diaktifkan" 
      });
      fetchAccounts();
    } catch (error: any) {
      console.error("Toggle status error:", error);
      toast({ title: "Gagal mengubah status", description: error.message, variant: "destructive" });
    }
  };

  const deleteAccount = async (account: ManagedAccount) => {
    try {
      const response = await supabase.functions.invoke("manage-accounts", {
        body: {
          action: "delete",
          user_id: account.user_id
        }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Berhasil", description: "Akun berhasil dihapus" });
      fetchAccounts();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ title: "Gagal menghapus akun", description: error.message, variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
      case "staff":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><UserCog className="w-3 h-3 mr-1" /> Staff</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Akun Staff</h1>
          <p className="text-muted-foreground">Tambah dan kelola akun admin atau staff korektor</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Akun
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Akun Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap (Opsional)</Label>
                <Input
                  id="fullName"
                  placeholder="Nama lengkap"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "staff")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff Korektor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Batal</Button>
              <Button onClick={createAccount} disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Buat Akun
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.length}</p>
                <p className="text-xs text-muted-foreground">Total Akun</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.filter(a => a.role === "admin").length}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.filter(a => a.role === "staff").length}</p>
                <p className="text-xs text-muted-foreground">Staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
          <CardDescription>Semua akun staff dan admin yang dikelola</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada akun yang ditambahkan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.email}</TableCell>
                      <TableCell>{account.full_name || "-"}</TableCell>
                      <TableCell>{getRoleBadge(account.role)}</TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? "default" : "secondary"} className={account.is_active ? "bg-green-500/10 text-green-500" : ""}>
                          {account.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(account.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Dialog open={passwordDialogOpen && selectedAccount?.id === account.id} onOpenChange={(open) => {
                            setPasswordDialogOpen(open);
                            if (!open) setSelectedAccount(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedAccount(account)}
                              >
                                <Key className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ubah Password</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <p className="text-sm text-muted-foreground">
                                  Ubah password untuk <strong>{account.email}</strong>
                                </p>
                                <div className="space-y-2">
                                  <Label htmlFor="newPassword">Password Baru</Label>
                                  <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Minimal 6 karakter"
                                    value={newPasswordInput}
                                    onChange={(e) => setNewPasswordInput(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Batal</Button>
                                <Button onClick={updatePassword} disabled={isUpdatingPassword}>
                                  {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  Simpan
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus(account)}
                          >
                            {account.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Akun?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus akun <strong>{account.email}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteAccount(account)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog for Change Password */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Ubah password untuk <strong>{selectedAccount?.email}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPasswordModal">Password Baru</Label>
              <Input
                id="newPasswordModal"
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordDialogOpen(false); setSelectedAccount(null); }}>Batal</Button>
            <Button onClick={updatePassword} disabled={isUpdatingPassword}>
              {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}