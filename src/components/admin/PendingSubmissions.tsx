import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, AlertCircle, ExternalLink, FileX } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MayarTransaction {
  id: string;
  name: string;
  email: string;
  mobile: string;
  amount: number;
  status: string;
  createdAt: string | number;
  licenseCode?: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    mobile: string;
  };
  paymentLink?: {
    id: string;
    name: string;
  };
}

interface SubmittedToken {
  token_code: string;
}

export function PendingSubmissions() {
  const [paidTransactions, setPaidTransactions] = useState<MayarTransaction[]>([]);
  const [submittedTokens, setSubmittedTokens] = useState<SubmittedToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch paid transactions from Mayar (only paid, exclude free)
      const { data: mayarData, error: mayarError } = await supabase.functions.invoke('mayar-api', {
        body: { 
          endpoint: 'transactions',
          params: { status: 'paid', pageSize: 500 }
        }
      });

      if (mayarError) throw mayarError;

      // Filter only paid transactions with amount > 0 (not free)
      const paidOnly = (mayarData?.data || []).filter(
        (t: MayarTransaction) => t.status === 'paid' && t.amount > 0
      );
      setPaidTransactions(paidOnly);

      // Fetch all submitted tokens from scholarship_tokens that are used
      const { data: tokensData, error: tokensError } = await supabase
        .from("scholarship_tokens")
        .select("token_code")
        .eq("status", "digunakan");

      if (tokensError) throw tokensError;
      setSubmittedTokens(tokensData || []);

    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Gagal memuat data");
      toast({
        title: "Error",
        description: err.message || "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Find paid transactions that haven't submitted documents
  const pendingSubmissions = useMemo(() => {
    const submittedSet = new Set(submittedTokens.map(t => t.token_code.toLowerCase()));
    
    return paidTransactions.filter(transaction => {
      // Get license code from transaction (from Mayar license system)
      const licenseCode = transaction.licenseCode || 
        (transaction as any).license?.code || 
        (transaction as any).licenseKey;
      
      if (!licenseCode) return false;
      
      // Check if this license code has been used for submission
      return !submittedSet.has(licenseCode.toLowerCase());
    });
  }, [paidTransactions, submittedTokens]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateInput: string | number) => {
    try {
      const date = typeof dateInput === 'number' 
        ? new Date(dateInput * 1000) 
        : new Date(dateInput);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const generateWhatsAppLink = (phone: string, name: string) => {
    const cleanPhone = phone?.replace(/\D/g, '') || '';
    const formattedPhone = cleanPhone.startsWith('0') 
      ? '62' + cleanPhone.slice(1) 
      : cleanPhone.startsWith('62') 
        ? cleanPhone 
        : '62' + cleanPhone;
    
    const message = encodeURIComponent(
      `Halo ${name},\n\nKami ingin mengingatkan bahwa Anda telah melakukan pembelian token beasiswa, namun kami belum menerima berkas pendaftaran Anda.\n\nSilakan segera mengunggah berkas Anda melalui website kami untuk melanjutkan proses pendaftaran beasiswa.\n\nTerima kasih.`
    );
    
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileX className="w-5 h-5 text-amber-500" />
                Pembeli Belum Kirim Berkas
              </CardTitle>
              <CardDescription>
                Daftar pembeli token berbayar yang belum mengirimkan berkas pendaftaran
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 text-destructive py-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileX className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Semua pembeli token berbayar sudah mengirimkan berkas</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Badge variant="secondary" className="text-amber-600 bg-amber-100">
                  {pendingSubmissions.length} pembeli belum kirim berkas
                </Badge>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead>Tanggal Beli</TableHead>
                      <TableHead>Kode Lisensi</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSubmissions.map((transaction) => {
                      const customerName = transaction.customer?.name || transaction.name || '-';
                      const customerEmail = transaction.customer?.email || transaction.email || '-';
                      const customerPhone = transaction.customer?.mobile || transaction.mobile || '';
                      const licenseCode = transaction.licenseCode || 
                        (transaction as any).license?.code || 
                        (transaction as any).licenseKey || '-';

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{customerName}</TableCell>
                          <TableCell>{customerEmail}</TableCell>
                          <TableCell>{customerPhone || '-'}</TableCell>
                          <TableCell>{transaction.paymentLink?.name || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {licenseCode}
                            </code>
                          </TableCell>
                          <TableCell className="text-center">
                            {customerPhone ? (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <a
                                  href={generateWhatsAppLink(customerPhone, customerName)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  WhatsApp
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Phone</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}