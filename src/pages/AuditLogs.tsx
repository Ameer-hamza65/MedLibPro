import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEnterprise } from '@/context/EnterpriseContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Building2, 
  Search, 
  Download, 
  Filter,
  BookOpen,
  FileText,
  LogIn,
  LogOut,
  FolderOpen,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuditLogEntry } from '@/data/mockEnterpriseData';

export default function AuditLogs() {
  const navigate = useNavigate();
  const { 
    currentEnterprise, 
    isEnterpriseMode,
    auditLogs,
    isAdmin,
    isComplianceOfficer
  } = useEnterprise();

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');

  // Require enterprise mode and appropriate role
  if (!isEnterpriseMode || !currentEnterprise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Enterprise Access Required</CardTitle>
            <CardDescription>
              Please log in with an enterprise account to view audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin() && !isComplianceOfficer()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Audit logs are only accessible to administrators and compliance officers.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/enterprise')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actionIcons: Record<AuditLogEntry['action'], React.ReactNode> = {
    view_book: <BookOpen className="h-4 w-4" />,
    view_chapter: <FileText className="h-4 w-4" />,
    search: <Search className="h-4 w-4" />,
    download: <Download className="h-4 w-4" />,
    login: <LogIn className="h-4 w-4" />,
    logout: <LogOut className="h-4 w-4" />,
    access_collection: <FolderOpen className="h-4 w-4" />,
    request_addon: <BookOpen className="h-4 w-4" />
  };

  const actionLabels: Record<AuditLogEntry['action'], string> = {
    view_book: 'Viewed Book',
    view_chapter: 'Viewed Chapter',
    search: 'Search',
    download: 'Download',
    login: 'Login',
    logout: 'Logout',
    access_collection: 'Accessed Collection',
    request_addon: 'Add-On Request'
  };

  const filteredLogs = useMemo(() => {
    let logs = auditLogs.filter(log => log.enterpriseId === currentEnterprise.id);

    // Date filter
    const now = new Date();
    if (dateFilter === '24hours') {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      logs = logs.filter(log => new Date(log.timestamp) >= cutoff);
    } else if (dateFilter === '7days') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      logs = logs.filter(log => new Date(log.timestamp) >= cutoff);
    } else if (dateFilter === '30days') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      logs = logs.filter(log => new Date(log.timestamp) >= cutoff);
    }

    // Action filter
    if (actionFilter !== 'all') {
      logs = logs.filter(log => log.action === actionFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(log => 
        log.userName.toLowerCase().includes(query) ||
        log.targetTitle?.toLowerCase().includes(query) ||
        (log.metadata as any)?.query?.toLowerCase().includes(query)
      );
    }

    return logs;
  }, [auditLogs, currentEnterprise.id, dateFilter, actionFilter, searchQuery]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="medical-gradient">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-muted-foreground">{currentEnterprise.name}</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/enterprise')}>
              Back to Dashboard
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
        <Card className="mb-6 glass-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, content, or query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="view_book">View Book</SelectItem>
                  <SelectItem value="view_chapter">View Chapter</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                  <SelectItem value="access_collection">Access Collection</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24hours">Last 24 hours</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >

        {/* Logs Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Activity Log</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[180px]">User</TableHead>
                    <TableHead className="w-[140px]">Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[120px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No audit log entries found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => {
                      const { date, time } = formatTimestamp(log.timestamp);
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm">{date}</div>
                            <div className="text-xs text-muted-foreground">{time}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{log.userName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              {actionIcons[log.action]}
                              {actionLabels[log.action]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.targetTitle && (
                              <div className="text-sm">{log.targetTitle}</div>
                            )}
                            {log.metadata && (log.metadata as any).query && (
                              <div className="text-sm">
                                Query: "<span className="font-medium">{(log.metadata as any).query}</span>"
                                {(log.metadata as any).results && (
                                  <span className="text-muted-foreground"> ({(log.metadata as any).results} results)</span>
                                )}
                              </div>
                            )}
                            {!log.targetTitle && !log.metadata && (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground font-mono">
                              {log.ipAddress || '—'}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
