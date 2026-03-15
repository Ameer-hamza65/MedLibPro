import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEnterprise } from '@/context/EnterpriseContext';
import { useBooks } from '@/context/BookContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  BookOpen, 
  Shield, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Settings,
  Sparkles,
  Clock,
  Crown,
  Lock,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TierBadge } from '@/components/TierBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CHART_COLORS = ['hsl(166 76% 32%)', 'hsl(213 50% 35%)', 'hsl(38 92% 50%)', 'hsl(280 50% 40%)', 'hsl(0 65% 35%)'];

interface AIQueryLog {
  id: string;
  query_type: string;
  book_title: string;
  chapter_title: string;
  response_time_ms: number;
  created_at: string;
}

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const [aiLogs, setAiLogs] = useState<AIQueryLog[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const { 
    currentEnterprise, 
    currentUser, 
    isEnterpriseMode,
    usageStats, 
    complianceStatus,
    currentTier,
    isSeatLimitExceeded,
    seatUtilizationPercent,
    facilities,
    facilityUsageStats,
    getEnterpriseFacilities,
    getEnterpriseUsers,
    getEnterpriseDepartments,
    getEnterpriseBookAccess,
    isAdmin,
    isComplianceOfficer
  } = useEnterprise();
  const { books } = useBooks();

  useEffect(() => {
    async function fetchAILogs() {
      setAiLoading(true);
      const { data } = await supabase
        .from('ai_query_logs')
        .select('id, query_type, book_title, chapter_title, response_time_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      setAiLogs(data || []);
      setAiLoading(false);
    }
    fetchAILogs();
  }, []);

  if (!isEnterpriseMode || !currentEnterprise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Enterprise Access Required</CardTitle>
            <CardDescription>
              Please log in with an enterprise account to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const enterpriseUsers = getEnterpriseUsers(currentEnterprise.id);
  const enterpriseDepartments = getEnterpriseDepartments(currentEnterprise.id);
  const enterpriseBookAccess = getEnterpriseBookAccess(currentEnterprise.id);
  const accessibleBooks = books.filter(b => enterpriseBookAccess.some(ba => ba.bookId === b.id));

  const complianceStatusColors = {
    compliant: 'bg-success/10 text-success border-success/20',
    attention: 'bg-warning/10 text-warning border-warning/30',
    critical: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const complianceIcons = {
    compliant: CheckCircle,
    attention: AlertTriangle,
    critical: XCircle
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="medical-gradient">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: currentEnterprise.logoColor }}
                >
                  {currentEnterprise.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{currentEnterprise.name}</h1>
                  <p className="text-muted-foreground text-sm">
                    {currentEnterprise.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {currentEnterprise.domain}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentTier && <TierBadge tier={currentTier.id} size="lg" />}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Logged in as</p>
                <p className="font-medium">{currentUser?.name}</p>
                <Badge variant="secondary" className="mt-1">
                  {currentUser?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Seat Warning Banner */}
        {seatUtilizationPercent >= 90 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className={`${isSeatLimitExceeded ? 'border-destructive/50 bg-destructive/5' : 'border-warning/50 bg-warning/5'}`}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${isSeatLimitExceeded ? 'text-destructive' : 'text-warning'}`} />
                    <div>
                      <p className="font-semibold text-sm">
                        {isSeatLimitExceeded ? 'Seat limit exceeded' : 'Approaching seat limit'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentEnterprise.usedSeats} of {currentEnterprise.licenseSeats} seats used ({seatUtilizationPercent}%)
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/subscribe')}>
                    {isSeatLimitExceeded ? 'Upgrade Now' : 'Manage Seats'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Current Plan Card */}
        {currentTier && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-lg">{currentTier.name} Plan</h3>
                      <TierBadge tier={currentTier.id} showTooltip={false} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">{currentTier.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-2xl font-bold">{currentEnterprise.usedSeats}/{currentEnterprise.licenseSeats === -1 ? '∞' : currentEnterprise.licenseSeats}</p>
                      <p className="text-xs text-muted-foreground">Seats</p>
                      {currentEnterprise.licenseSeats > 0 && (
                        <Progress value={seatUtilizationPercent} className={`h-1.5 mt-1 ${seatUtilizationPercent >= 90 ? '[&>div]:bg-destructive' : seatUtilizationPercent >= 75 ? '[&>div]:bg-warning' : ''}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{currentTier.maxCollections === -1 ? '5' : currentTier.maxCollections}</p>
                      <p className="text-xs text-muted-foreground">Collections</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{currentTier.features.aiUsageMonthly === -1 ? '∞' : currentTier.features.aiUsageMonthly}</p>
                      <p className="text-xs text-muted-foreground">AI Queries/mo</p>
                    </div>
                  </div>
                  {currentTier.id !== 'enterprise' && (
                    <Button onClick={() => navigate('/subscribe')} className="gap-2">
                      <Crown className="h-4 w-4" />
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-3xl font-bold">{currentEnterprise.usedSeats}</p>
                  <p className="text-xs text-muted-foreground">of {currentEnterprise.licenseSeats} seats</p>
                </div>
                <Users className="h-10 w-10 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Titles</p>
                  <p className="text-3xl font-bold">{accessibleBooks.length}</p>
                  <p className="text-xs text-muted-foreground">in your license</p>
                </div>
                <BookOpen className="h-10 w-10 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views (30d)</p>
                  <p className="text-3xl font-bold">{usageStats.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-success">+12% from last month</p>
                </div>
                <TrendingUp className="h-10 w-10 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Score</p>
                  <p className="text-3xl font-bold">87%</p>
                  <p className="text-xs text-warning">1 area needs attention</p>
                </div>
                <Shield className="h-10 w-10 text-accent" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            {(isAdmin() || isComplianceOfficer()) && (
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            )}
            {isAdmin() && (
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Activity</CardTitle>
                  <CardDescription>Views and searches over the past 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={usageStats.dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(166 76% 32%)" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(166 76% 32%)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="searches" 
                          stroke="hsl(213 50% 35%)" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(213 50% 35%)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Usage by Department */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Usage by Department</CardTitle>
                  <CardDescription>Content views distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={usageStats.viewsByDepartment} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis 
                          type="category" 
                          dataKey="departmentName" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          width={120}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="views" fill="hsl(166 76% 32%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Content */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Accessed Titles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {usageStats.topBooks.map((book, index) => (
                      <div key={book.bookId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                          <span className="text-sm font-medium truncate max-w-[250px]">{book.title}</span>
                        </div>
                        <Badge variant="secondary">{book.views.toLocaleString()} views</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Searches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {usageStats.topSearches.map((search, index) => (
                      <div key={search.query} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                          <span className="text-sm font-medium">{search.query}</span>
                        </div>
                        <Badge variant="secondary">{search.count} searches</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Multi-Location Facility Overview (Enterprise tier only) */}
            {currentTier?.features.multiLocation && currentEnterprise && (() => {
              const enterpriseFacilities = getEnterpriseFacilities(currentEnterprise.id);
              const facilityStats = facilityUsageStats.filter(fs => 
                enterpriseFacilities.some(f => f.id === fs.facilityId)
              );
              
              if (enterpriseFacilities.length === 0) return null;
              
              return (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-accent" />
                    Multi-Location Overview
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enterpriseFacilities.map((facility) => {
                      const stats = facilityStats.find(fs => fs.facilityId === facility.id);
                      return (
                        <Card key={facility.id} className={!facility.isActive ? 'opacity-60' : ''}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {facility.type.replace('_', ' ')}
                              </Badge>
                              {facility.isActive ? (
                                <Badge className="bg-success/10 text-success border-success/20 text-xs">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <CardTitle className="text-base mt-2">{facility.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {facility.city}, {facility.state}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">Seats</p>
                                <p className="font-semibold">{facility.usedSeats}/{facility.seatAllocation}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Compliance</p>
                                <p className="font-semibold">{stats?.complianceScore ?? '—'}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">Views</p>
                                <p className="font-semibold">{stats?.totalViews?.toLocaleString() ?? '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">AI Queries</p>
                                <p className="font-semibold">{stats?.aiQueries?.toLocaleString() ?? '—'}</p>
                              </div>
                            </div>
                            {/* Seat utilization bar */}
                            <div className="mt-3">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-accent rounded-full"
                                  style={{ width: `${(facility.usedSeats / facility.seatAllocation) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((facility.usedSeats / facility.seatAllocation) * 100)}% seat utilization
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Aggregated Stats */}
                  <Card className="bg-accent/5 border-accent/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-accent" />
                        <h4 className="font-semibold">Aggregated Multi-Location Summary</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{enterpriseFacilities.length}</p>
                          <p className="text-xs text-muted-foreground">Facilities</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {enterpriseFacilities.reduce((sum, f) => sum + f.usedSeats, 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Active Users</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {facilityStats.reduce((sum, s) => sum + s.totalViews, 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Views</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {facilityStats.reduce((sum, s) => sum + s.aiQueries, 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">AI Queries</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {facilityStats.length > 0 
                              ? Math.round(facilityStats.reduce((sum, s) => sum + s.complianceScore, 0) / facilityStats.length) 
                              : 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Avg Compliance</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Compliance Status Cards */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-lg">Compliance Areas</h3>
                {complianceStatus.map((status) => {
                  const StatusIcon = complianceIcons[status.status];
                  return (
                    <Card key={status.category}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <StatusIcon className={`h-6 w-6 ${
                              status.status === 'compliant' ? 'text-success' :
                              status.status === 'attention' ? 'text-warning' : 'text-destructive'
                            }`} />
                            <div>
                              <p className="font-medium">{status.category}</p>
                              <p className="text-sm text-muted-foreground">
                                Next review: {new Date(status.nextReviewDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={complianceStatusColors[status.status]}>
                              {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                            </Badge>
                            <p className="text-2xl font-bold mt-1">{status.completionRate}%</p>
                          </div>
                        </div>
                        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              status.status === 'compliant' ? 'bg-success' :
                              status.status === 'attention' ? 'bg-warning' : 'bg-destructive'
                            }`}
                            style={{ width: `${status.completionRate}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Compliance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Compliant', value: complianceStatus.filter(s => s.status === 'compliant').length },
                            { name: 'Attention', value: complianceStatus.filter(s => s.status === 'attention').length },
                            { name: 'Critical', value: complianceStatus.filter(s => s.status === 'critical').length }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="hsl(152 69% 31%)" />
                          <Cell fill="hsl(38 92% 50%)" />
                          <Cell fill="hsl(0 84% 60%)" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-success" />
                        Compliant
                      </span>
                      <span className="font-medium">{complianceStatus.filter(s => s.status === 'compliant').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-warning" />
                        Attention
                      </span>
                      <span className="font-medium">{complianceStatus.filter(s => s.status === 'attention').length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-destructive" />
                        Critical
                      </span>
                      <span className="font-medium">{complianceStatus.filter(s => s.status === 'critical').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* AI Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total AI Queries</p>
                      <p className="text-3xl font-bold">{aiLogs.length}</p>
                      <p className="text-xs text-muted-foreground">all time</p>
                    </div>
                    <Sparkles className="h-10 w-10 text-accent" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                      <p className="text-3xl font-bold">
                        {aiLogs.length > 0 
                          ? (aiLogs.reduce((s, l) => s + l.response_time_ms, 0) / aiLogs.length / 1000).toFixed(1) 
                          : '0'}s
                      </p>
                      <p className="text-xs text-muted-foreground">across all queries</p>
                    </div>
                    <Clock className="h-10 w-10 text-accent" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Query Types Used</p>
                      <p className="text-3xl font-bold">
                        {new Set(aiLogs.map(l => l.query_type)).size}
                      </p>
                      <p className="text-xs text-muted-foreground">distinct types</p>
                    </div>
                    <BarChart3 className="h-10 w-10 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Queries by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Queries by Type</CardTitle>
                  <CardDescription>Distribution of AI query types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {(() => {
                      const typeCounts = aiLogs.reduce<Record<string, number>>((acc, l) => {
                        acc[l.query_type] = (acc[l.query_type] || 0) + 1;
                        return acc;
                      }, {});
                      const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
                      return pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                              {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No AI queries yet</div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Most Queried Books */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Queried Titles</CardTitle>
                  <CardDescription>Books with the most AI interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const bookCounts = aiLogs.reduce<Record<string, number>>((acc, l) => {
                        acc[l.book_title] = (acc[l.book_title] || 0) + 1;
                        return acc;
                      }, {});
                      const sorted = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                      return sorted.length > 0 ? sorted.map(([title, count], i) => (
                        <div key={title} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                            <span className="text-sm font-medium truncate max-w-[250px]">{title}</span>
                          </div>
                          <Badge variant="secondary">{count} queries</Badge>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No AI queries yet</p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent AI Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent AI Activity</CardTitle>
                <CardDescription>Latest AI queries from your organization</CardDescription>
              </CardHeader>
              <CardContent>
                {aiLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
                ) : aiLogs.length > 0 ? (
                  <div className="space-y-3">
                    {aiLogs.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs capitalize">{log.query_type}</Badge>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[300px]">{log.book_title}</p>
                            <p className="text-xs text-muted-foreground">{log.chapter_title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{(log.response_time_ms / 1000).toFixed(1)}s</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No AI queries recorded yet. Use the AI Assistant in the reader to get started.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          {(isAdmin() || isComplianceOfficer()) && (
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Reports</CardTitle>
                  <CardDescription>
                    Generate compliance and usage reports for regulatory requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span>Usage Report</span>
                      <span className="text-xs text-muted-foreground">Export content access logs</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Shield className="h-6 w-6" />
                      <span>Compliance Report</span>
                      <span className="text-xs text-muted-foreground">Training completion status</span>
                    </Button>
                    {currentTier?.features.individualUserTracking ? (
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Users className="h-6 w-6" />
                        <span>User Activity</span>
                        <span className="text-xs text-muted-foreground">Individual user metrics</span>
                      </Button>
                    ) : (
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2 opacity-50" disabled>
                        <Lock className="h-6 w-6 text-muted-foreground" />
                        <span>User Activity</span>
                        <span className="text-xs text-warning">Pro plan required</span>
                      </Button>
                    )}
                    {currentTier?.features.csvExport ? (
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                        <Download className="h-6 w-6" />
                        <span>CSV Export</span>
                        <span className="text-xs text-muted-foreground">Download usage data</span>
                      </Button>
                    ) : (
                      <Button variant="outline" className="h-auto py-4 flex-col gap-2 opacity-50" disabled>
                        <Lock className="h-6 w-6 text-muted-foreground" />
                        <span>CSV Export</span>
                        <span className="text-xs text-warning">Pro plan required</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Settings Tab */}
          {isAdmin() && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise Settings</CardTitle>
                  <CardDescription>
                    Manage your organization's configuration and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Settings panel is under development.</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
