import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight, ExternalLink, TrendingUp, Receipt, ChevronLeft, ChevronRight, MessageCircle, Send, Clock, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MayarBalance {
  balance: number;
  pendingBalance: number;
  currency: string;
}

interface MayarTransaction {
  id: string;
  name: string;
  email: string;
  mobile: string;
  amount: number;
  status: string;
  createdAt: string | number;
  type: string;
  description: string;
  link?: string;
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
  credit?: number;
}

export function MayarDashboard() {
  const [balance, setBalance] = useState<MayarBalance | null>(null);
  const [allTransactions, setAllTransactions] = useState<MayarTransaction[]>([]);
  const [unpaidTransactions, setUnpaidTransactions] = useState<MayarTransaction[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingUnpaid, setIsLoadingUnpaid] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [unpaidCurrentPage, setUnpaidCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [monthsFilter, setMonthsFilter] = useState(6);
  const [selectedUnpaid, setSelectedUnpaid] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("paid");

  const lastFetchRef = useRef<{ balance?: number; transactions?: number; unpaid?: number }>({});
  const isThrottled = (key: keyof NonNullable<typeof lastFetchRef.current>) => {
    const last = lastFetchRef.current[key] ?? 0;
    return Date.now() - last < 60_000; // Mayar: max 20 req/min
  };

  useEffect(() => {
    fetchBalance();
    const timer = setTimeout(() => fetchAllTransactions(), 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchBalance = async () => {
    if (isThrottled('balance')) {
      toast({
        title: "Terlalu sering refresh",
        description: "Mayar membatasi 20 request/menit. Coba lagi dalam 1 menit.",
        variant: "destructive",
      });
      return;
    }

    lastFetchRef.current.balance = Date.now();
    setIsLoadingBalance(true);
    try {
      const { data, error } = await supabase.functions.invoke('mayar-api', {
        body: { endpoint: 'balance' }
      });

      if (error) throw error;
      
      if (data?.data) {
        setBalance({
          balance: data.data.balance || data.data.balanceActive || 0,
          pendingBalance: data.data.pendingBalance || data.data.balancePending || 0,
          currency: data.data.currency || 'IDR'
        });
      }
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('rate');
      toast({
        title: isRateLimit ? "Rate Limit" : "Gagal memuat saldo",
        description: isRateLimit ? "Mohon tunggu 1 menit sebelum mencoba lagi" : (error.message || "Terjadi kesalahan"),
        variant: "destructive"
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchAllTransactions = async () => {
    if (isThrottled('transactions')) {
      toast({
        title: "Terlalu sering refresh",
        description: "Mayar membatasi 20 request/menit. Coba lagi dalam 1 menit.",
        variant: "destructive",
      });
      return;
    }

    lastFetchRef.current.transactions = Date.now();
    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase.functions.invoke('mayar-api', {
        body: { 
          endpoint: 'transactions',
          params: { page: '1', pageSize: '100' }
        }
      });

      if (error) throw error;
      
      if (data?.data) {
        // Map transactions with customer data
        const mappedTransactions = data.data.map((tx: any) => ({
          id: tx.id,
          name: tx.customer?.name || tx.name || '-',
          email: tx.customer?.email || tx.email || '-',
          mobile: tx.customer?.mobile || tx.mobile || '',
          amount: tx.credit || tx.amount || 0,
          status: tx.status,
          createdAt: tx.createdAt,
          type: tx.balanceHistoryType || tx.type || '',
          description: tx.description || tx.paymentLink?.name || '',
          link: tx.paymentLinkTransaction?.id || tx.link || '',
          customer: tx.customer,
          paymentLink: tx.paymentLink
        }));
        setAllTransactions(mappedTransactions);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      const isRateLimit = error.message?.includes('429') || error.message?.includes('rate');
      toast({
        title: isRateLimit ? "Rate Limit" : "Gagal memuat transaksi",
        description: isRateLimit ? "Mohon tunggu 1 menit sebelum mencoba lagi" : (error.message || "Terjadi kesalahan"),
        variant: "destructive"
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const fetchUnpaidTransactions = async () => {
    if (isThrottled('unpaid')) {
      toast({
        title: "Terlalu sering refresh",
        description: "Mayar membatasi 20 request/menit. Coba lagi dalam 1 menit.",
        variant: "destructive",
      });
      return;
    }

    lastFetchRef.current.unpaid = Date.now();
    setIsLoadingUnpaid(true);
    try {
      // Use the dedicated unpaid transactions endpoint
      const { data, error } = await supabase.functions.invoke('mayar-api', {
        body: { 
          endpoint: 'transactions/unpaid',
          params: { page: '1', pageSize: '50' }
        }
      });

      if (error) throw error;
      
      if (data?.data && Array.isArray(data.data)) {
        const mappedUnpaid = data.data.map((tx: any) => ({
          id: tx.id,
          name: tx.customer?.name || tx.name || '-',
          email: tx.customer?.email || tx.email || '-',
          mobile: tx.customer?.mobile || tx.mobile || '',
          amount: tx.amount || tx.credit || 0,
          status: tx.status || 'unpaid',
          createdAt: tx.createdAt,
          type: tx.balanceHistoryType || tx.type || 'payment_request',
          description: tx.description || tx.paymentLink?.name || '',
          link: tx.link || tx.paymentLinkTransaction?.id || '',
          customer: tx.customer,
          paymentLink: tx.paymentLink
        }));
        setUnpaidTransactions(mappedUnpaid);
      }
    } catch (error: any) {
      console.error('Error fetching unpaid transactions:', error);
      toast({
        title: "Gagal memuat transaksi unpaid",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUnpaid(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "unpaid" && unpaidTransactions.length === 0) {
      setTimeout(() => fetchUnpaidTransactions(), 500);
    }
  };

  // Filter paid/settled transactions (show all, not just amount > 0)
  const paidTransactions = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsFilter);
    
    return allTransactions.filter(tx => {
      // Show all settled/success transactions
      const isSettled = ['settled', 'success', 'paid'].includes(tx.status?.toLowerCase() || '');
      if (!isSettled) return false;
      
      if (tx.createdAt) {
        const txDate = new Date(typeof tx.createdAt === 'number' ? tx.createdAt : tx.createdAt);
        if (txDate < cutoffDate) return false;
      }
      
      return true;
    });
  }, [allTransactions, monthsFilter]);

  // Pagination for paid
  const totalPages = Math.ceil(paidTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return paidTransactions.slice(start, start + pageSize);
  }, [paidTransactions, currentPage, pageSize]);

  // Pagination for unpaid
  const unpaidTotalPages = Math.ceil(unpaidTransactions.length / pageSize);
  const paginatedUnpaid = useMemo(() => {
    const start = (unpaidCurrentPage - 1) * pageSize;
    return unpaidTransactions.slice(start, start + pageSize);
  }, [unpaidTransactions, unpaidCurrentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => {
    const successTx = paidTransactions.filter(tx => 
      ['success', 'paid', 'settled'].includes(tx.status?.toLowerCase())
    );
    const totalSuccessAmount = successTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    // Monthly breakdown
    const monthlyData: Record<string, number> = {};
    successTx.forEach(tx => {
      if (tx.createdAt) {
        const date = new Date(typeof tx.createdAt === 'number' ? tx.createdAt : tx.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = (monthlyData[key] || 0) + (tx.amount || 0);
      }
    });

    return {
      totalTransactions: paidTransactions.length,
      successCount: successTx.length,
      totalSuccessAmount,
      monthlyData,
      unpaidCount: unpaidTransactions.length,
      unpaidTotal: unpaidTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
    };
  }, [paidTransactions, unpaidTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateValue: string | number) => {
    const date = typeof dateValue === 'number' ? new Date(dateValue) : new Date(dateValue);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'paid':
      case 'settled':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Berhasil</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'unpaid':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Belum Bayar</Badge>;
      case 'failed':
      case 'cancelled':
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Gagal</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Generate WhatsApp link
  const generateWhatsAppLink = (tx: MayarTransaction, paymentUrl?: string) => {
    const phone = tx.mobile?.replace(/^0/, '62').replace(/\D/g, '') || '';
    if (!phone) return null;
    
    const paymentLink = paymentUrl || (tx.link ? `https://mayar.id/p/${tx.link}` : '');
    const message = encodeURIComponent(
      `Halo ${tx.name},\n\n` +
      `Kami mengingatkan bahwa Anda memiliki tagihan pembayaran sebesar ${formatCurrency(tx.amount)}.\n\n` +
      (paymentLink ? `Silakan lakukan pembayaran melalui link berikut:\n${paymentLink}\n\n` : '') +
      `Terima kasih.`
    );
    
    return `https://wa.me/${phone}?text=${message}`;
  };

  // Handle select all unpaid
  const handleSelectAllUnpaid = (checked: boolean) => {
    if (checked) {
      setSelectedUnpaid(paginatedUnpaid.filter(tx => tx.mobile).map(tx => tx.id));
    } else {
      setSelectedUnpaid([]);
    }
  };

  // Handle individual select
  const handleSelectUnpaid = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUnpaid(prev => [...prev, id]);
    } else {
      setSelectedUnpaid(prev => prev.filter(i => i !== id));
    }
  };

  // Send bulk WhatsApp reminders
  const sendBulkReminders = () => {
    const selectedTx = unpaidTransactions.filter(tx => selectedUnpaid.includes(tx.id) && tx.mobile);
    if (selectedTx.length === 0) {
      toast({
        title: "Tidak ada kontak yang dipilih",
        description: "Pilih transaksi dengan nomor WhatsApp terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    // Open WhatsApp links in new tabs (limited by browser)
    selectedTx.slice(0, 5).forEach((tx, index) => {
      const waLink = generateWhatsAppLink(tx);
      if (waLink) {
        setTimeout(() => {
          window.open(waLink, '_blank');
        }, index * 500);
      }
    });

    if (selectedTx.length > 5) {
      toast({
        title: "Perhatian",
        description: `Hanya ${5} kontak pertama yang dibuka. Silakan kirim sisanya secara bertahap.`,
      });
    } else {
      toast({
        title: "WhatsApp Dibuka",
        description: `${selectedTx.length} kontak WhatsApp telah dibuka di tab baru.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mayar Dashboard</h1>
          <p className="text-muted-foreground">Kelola saldo dan transaksi Mayar</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchBalance();
            setTimeout(() => {
              fetchAllTransactions();
              if (activeTab === 'unpaid') {
                setTimeout(() => fetchUnpaidTransactions(), 1500);
              }
            }, 1000);
          }}
          disabled={isLoadingBalance || isLoadingTransactions || isLoadingUnpaid}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(isLoadingBalance || isLoadingTransactions || isLoadingUnpaid) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Saldo Tersedia
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBalance ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                <span className="text-2xl font-bold text-foreground">
                  {balance ? formatCurrency(balance.balance) : 'Rp 0'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Saldo Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBalance ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ArrowDownRight className="w-6 h-6 text-amber-500" />
                <span className="text-2xl font-bold text-foreground">
                  {balance ? formatCurrency(balance.pendingBalance) : 'Rp 0'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Total Pembayaran Masuk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.totalSuccessAmount)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Belum Dibayar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUnpaid ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Memuat...</span>
              </div>
            ) : (
              <div>
                <span className="text-2xl font-bold text-orange-600">{stats.unpaidCount}</span>
                <span className="text-muted-foreground text-sm ml-2">tagihan</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      {Object.keys(stats.monthlyData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistik Bulanan</CardTitle>
            <CardDescription>Pendapatan per bulan dalam {monthsFilter} bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(stats.monthlyData)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 6)
                .map(([month, amount]) => {
                  const [year, monthNum] = month.split('-');
                  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
                  return (
                    <div key={month} className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground uppercase">{monthName}</p>
                      <p className="text-sm font-bold text-foreground mt-1">{formatCurrency(amount)}</p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Paid and Unpaid */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Pembayaran Masuk
          </TabsTrigger>
          <TabsTrigger value="unpaid" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Belum Dibayar
          </TabsTrigger>
        </TabsList>

        {/* Paid Transactions Tab */}
        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Transaksi Berhasil ({monthsFilter} Bulan Terakhir)
                  </CardTitle>
                  <CardDescription>
                    Menampilkan semua pembayaran masuk
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={monthsFilter.toString()} onValueChange={(v) => { setMonthsFilter(parseInt(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bulan</SelectItem>
                      <SelectItem value="3">3 Bulan</SelectItem>
                      <SelectItem value="6">6 Bulan</SelectItem>
                      <SelectItem value="12">12 Bulan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : paginatedTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada pembayaran masuk
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tanggal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTransactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-medium">{tx.name || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{tx.email || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">{tx.mobile || '-'}</TableCell>
                            <TableCell className="font-semibold text-primary">
                              {formatCurrency(tx.amount || 0)}
                            </TableCell>
                            <TableCell>{getStatusBadge(tx.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {tx.createdAt ? formatDate(tx.createdAt) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tampilkan</span>
                      <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per halaman</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Sebelumnya
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Halaman {currentPage} dari {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unpaid Transactions Tab */}
        <TabsContent value="unpaid">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Tagihan Belum Dibayar
                  </CardTitle>
                  <CardDescription>
                    Pilih tagihan untuk mengirim reminder WhatsApp
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedUnpaid.length > 0 && (
                    <Button
                      onClick={sendBulkReminders}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Reminder ({selectedUnpaid.length})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUnpaidTransactions}
                    disabled={isLoadingUnpaid}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingUnpaid ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUnpaid ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : paginatedUnpaid.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada tagihan yang belum dibayar
                </div>
              ) : (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedUnpaid.length === paginatedUnpaid.filter(tx => tx.mobile).length && paginatedUnpaid.filter(tx => tx.mobile).length > 0}
                              onCheckedChange={handleSelectAllUnpaid}
                            />
                          </TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedUnpaid.map((tx) => {
                          const waLink = generateWhatsAppLink(tx);
                          const paymentUrl = tx.link ? `https://mayar.id/p/${tx.link}` : '';
                          
                          return (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedUnpaid.includes(tx.id)}
                                  onCheckedChange={(checked) => handleSelectUnpaid(tx.id, checked as boolean)}
                                  disabled={!tx.mobile}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{tx.name || '-'}</TableCell>
                              <TableCell className="text-muted-foreground">{tx.email || '-'}</TableCell>
                              <TableCell className="text-muted-foreground">{tx.mobile || '-'}</TableCell>
                              <TableCell className="font-semibold text-orange-600">
                                {formatCurrency(tx.amount || 0)}
                              </TableCell>
                              <TableCell>{getStatusBadge(tx.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {waLink ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => window.open(waLink, '_blank')}
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">No WA</span>
                                  )}
                                  {paymentUrl && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-primary hover:text-primary/80"
                                      onClick={() => window.open(paymentUrl, '_blank')}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tampilkan</span>
                      <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setUnpaidCurrentPage(1); }}>
                        <SelectTrigger className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per halaman</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnpaidCurrentPage(unpaidCurrentPage - 1)}
                        disabled={unpaidCurrentPage <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Sebelumnya
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Halaman {unpaidCurrentPage} dari {unpaidTotalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnpaidCurrentPage(unpaidCurrentPage + 1)}
                        disabled={unpaidCurrentPage >= unpaidTotalPages}
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}