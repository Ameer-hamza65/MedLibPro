import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import {
  Enterprise,
  Department,
  EnterpriseUser,
  EnterpriseRole,
  ComplianceCollection,
  BookAccess,
  AuditLogEntry,
  UsageStats,
  ComplianceStatus,
  mockEnterprises,
  mockDepartments,
  mockEnterpriseUsers,
  mockComplianceCollections,
  mockBookAccess,
  mockAuditLogs,
  mockUsageStats,
  mockComplianceStatus
} from '@/data/mockEnterpriseData';
import {
  LicensingTier,
  TierDefinition,
  Facility,
  FacilityUsageStats,
  getTierDefinition,
  canAccessCollection,
  getAccessibleCollections,
  isWithinSeatLimit,
  getRemainingAIQueries,
  getCollectionIdsForDepartments,
  mockFacilities,
  mockFacilityUsageStats,
} from '@/data/complianceData';

interface EnterpriseContextType {
  // Current session
  currentEnterprise: Enterprise | null;
  currentUser: EnterpriseUser | null;
  isEnterpriseMode: boolean;
  
  // Data accessors
  enterprises: Enterprise[];
  departments: Department[];
  users: EnterpriseUser[];
  collections: ComplianceCollection[];
  bookAccess: BookAccess[];
  auditLogs: AuditLogEntry[];
  usageStats: UsageStats;
  complianceStatus: ComplianceStatus[];
  
  // Tier system
  currentTier: TierDefinition | null;
  
  // Multi-location
  facilities: Facility[];
  facilityUsageStats: FacilityUsageStats[];
  getEnterpriseFacilities: (enterpriseId: string) => Facility[];
  
  // Seat enforcement
  isSeatLimitExceeded: boolean;
  seatUtilizationPercent: number;
  
  // Actions
  loginAsEnterpriseUser: (userId: string) => void;
  loginAsEnterprise: (enterpriseId: string, role?: EnterpriseRole) => void;
  logoutEnterprise: () => void;
  
  // Access checks
  hasBookAccess: (bookId: string) => boolean;
  canAccessCollectionByTier: (collectionId: string) => boolean;
  getUserDepartments: (userId: string) => Department[];
  getEnterpriseUsers: (enterpriseId: string) => EnterpriseUser[];
  getEnterpriseDepartments: (enterpriseId: string) => Department[];
  getEnterpriseBookAccess: (enterpriseId: string) => BookAccess[];
  getCollectionBooks: (collectionId: string) => string[];
  
  // Department-level filtering
  getDepartmentAccessibleCollections: () => ComplianceCollection[];
  hasDepartmentAccessToCollection: (collectionId: string) => boolean;
  
  // Audit logging
  logAction: (action: AuditLogEntry['action'], targetType?: AuditLogEntry['targetType'], targetId?: string, targetTitle?: string, metadata?: Record<string, unknown>) => void;
  
  // Role checks
  isAdmin: () => boolean;
  isComplianceOfficer: () => boolean;
  isDepartmentManager: () => boolean;
  hasRole: (role: EnterpriseRole) => boolean;
}

const EnterpriseContext = createContext<EnterpriseContextType | undefined>(undefined);

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  const [enterprises] = useState<Enterprise[]>(mockEnterprises);
  const [departments] = useState<Department[]>(mockDepartments);
  const [users] = useState<EnterpriseUser[]>(mockEnterpriseUsers);
  const [collections] = useState<ComplianceCollection[]>(mockComplianceCollections);
  const [bookAccess] = useState<BookAccess[]>(mockBookAccess);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [usageStats] = useState<UsageStats>(mockUsageStats);
  const [complianceStatus] = useState<ComplianceStatus[]>(mockComplianceStatus);
  
  const [currentUser, setCurrentUser] = useState<EnterpriseUser | null>(null);
  const [currentEnterprise, setCurrentEnterprise] = useState<Enterprise | null>(null);

  const isEnterpriseMode = useMemo(() => currentEnterprise !== null, [currentEnterprise]);
  const currentTier = useMemo(() => 
    currentEnterprise ? getTierDefinition(currentEnterprise.licensingTier) : null,
    [currentEnterprise]
  );

  const seatUtilizationPercent = useMemo(() => {
    if (!currentEnterprise || currentEnterprise.licenseSeats === 0) return 0;
    return Math.round((currentEnterprise.usedSeats / currentEnterprise.licenseSeats) * 100);
  }, [currentEnterprise]);

  const isSeatLimitExceeded = useMemo(() => {
    if (!currentEnterprise || !currentTier) return false;
    return !isWithinSeatLimit(currentEnterprise.licensingTier, currentEnterprise.usedSeats);
  }, [currentEnterprise, currentTier]);

  const facilitiesState = useState<Facility[]>(mockFacilities)[0];
  const facilityUsageStatsState = useState<FacilityUsageStats[]>(mockFacilityUsageStats)[0];

  const getEnterpriseFacilities = useCallback((enterpriseId: string): Facility[] => {
    return facilitiesState.filter(f => f.enterpriseId === enterpriseId);
  }, [facilitiesState]);

  const canAccessCollectionByTier = useCallback((collectionId: string): boolean => {
    if (!currentEnterprise) return false;
    return canAccessCollection(currentEnterprise.licensingTier, collectionId);
  }, [currentEnterprise]);

  const loginAsEnterpriseUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      const enterprise = enterprises.find(e => e.id === user.enterpriseId);
      if (enterprise) {
        setCurrentEnterprise(enterprise);
      }
    }
  }, [users, enterprises]);

  const loginAsEnterprise = useCallback((enterpriseId: string, role: EnterpriseRole = 'staff') => {
    const enterprise = enterprises.find(e => e.id === enterpriseId);
    if (enterprise) {
      setCurrentEnterprise(enterprise);
      // Find a user with the specified role, or create a demo user
      const enterpriseUsers = users.filter(u => u.enterpriseId === enterpriseId);
      const userWithRole = enterpriseUsers.find(u => u.role === role) || enterpriseUsers[0];
      if (userWithRole) {
        setCurrentUser(userWithRole);
      } else {
        // Create demo user for the enterprise
        setCurrentUser({
          id: `demo-${enterpriseId}`,
          email: `demo@${enterprise.domain}`,
          name: 'Demo User',
          enterpriseId: enterpriseId,
          departmentIds: [],
          role: role,
          isActive: true
        });
      }
    }
  }, [enterprises, users]);

  const logoutEnterprise = useCallback(() => {
    setCurrentUser(null);
    setCurrentEnterprise(null);
  }, []);

  const hasBookAccess = useCallback((bookId: string): boolean => {
    if (!currentEnterprise) return false;
    const access = bookAccess.find(
      ba => ba.enterpriseId === currentEnterprise.id && ba.bookId === bookId
    );
    return access?.accessLevel === 'full';
  }, [currentEnterprise, bookAccess]);

  const getUserDepartments = useCallback((userId: string): Department[] => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    return departments.filter(d => user.departmentIds.includes(d.id));
  }, [users, departments]);

  const getEnterpriseUsers = useCallback((enterpriseId: string): EnterpriseUser[] => {
    return users.filter(u => u.enterpriseId === enterpriseId);
  }, [users]);

  const getEnterpriseDepartments = useCallback((enterpriseId: string): Department[] => {
    return departments.filter(d => d.enterpriseId === enterpriseId);
  }, [departments]);

  const getEnterpriseBookAccess = useCallback((enterpriseId: string): BookAccess[] => {
    return bookAccess.filter(ba => ba.enterpriseId === enterpriseId);
  }, [bookAccess]);

  const getCollectionBooks = useCallback((collectionId: string): string[] => {
    const collection = collections.find(c => c.id === collectionId);
    return collection?.bookIds || [];
  }, [collections]);

  // Department-level access filtering
  const hasDepartmentAccessToCollection = useCallback((collectionId: string): boolean => {
    if (!currentUser || !currentEnterprise) return false;
    // Admins and compliance officers bypass department filtering
    if (currentUser.role === 'admin' || currentUser.role === 'compliance_officer') return true;
    if (currentUser.departmentIds.length === 0) return false;
    const accessibleIds = getCollectionIdsForDepartments(currentUser.departmentIds);
    return accessibleIds.includes(collectionId);
  }, [currentUser, currentEnterprise]);

  const getDepartmentAccessibleCollections = useCallback((): ComplianceCollection[] => {
    if (!currentUser || !currentEnterprise) return [];
    // Admins and compliance officers see everything
    if (currentUser.role === 'admin' || currentUser.role === 'compliance_officer') return collections;
    if (currentUser.departmentIds.length === 0) return [];
    const accessibleIds = new Set(getCollectionIdsForDepartments(currentUser.departmentIds));
    return collections.filter(c => accessibleIds.has(c.id));
  }, [currentUser, currentEnterprise, collections]);

  const logAction = useCallback((
    action: AuditLogEntry['action'],
    targetType?: AuditLogEntry['targetType'],
    targetId?: string,
    targetTitle?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!currentUser || !currentEnterprise) return;
    
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      enterpriseId: currentEnterprise.id,
      action,
      targetType,
      targetId,
      targetTitle,
      metadata,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100' // Mock IP
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser, currentEnterprise]);

  const isAdmin = useCallback(() => currentUser?.role === 'admin', [currentUser]);
  const isComplianceOfficer = useCallback(() => 
    currentUser?.role === 'compliance_officer' || currentUser?.role === 'admin', 
    [currentUser]
  );
  const isDepartmentManager = useCallback(() => 
    ['department_manager', 'compliance_officer', 'admin'].includes(currentUser?.role || ''),
    [currentUser]
  );
  const hasRole = useCallback((role: EnterpriseRole) => currentUser?.role === role, [currentUser]);

  const value: EnterpriseContextType = {
    currentEnterprise,
    currentUser,
    isEnterpriseMode,
    enterprises,
    departments,
    users,
    collections,
    bookAccess,
    auditLogs,
    usageStats,
    complianceStatus,
    currentTier,
    isSeatLimitExceeded,
    seatUtilizationPercent,
    facilities: facilitiesState,
    facilityUsageStats: facilityUsageStatsState,
    getEnterpriseFacilities,
    loginAsEnterpriseUser,
    loginAsEnterprise,
    logoutEnterprise,
    hasBookAccess,
    canAccessCollectionByTier,
    getUserDepartments,
    getEnterpriseUsers,
    getEnterpriseDepartments,
    getEnterpriseBookAccess,
    getCollectionBooks,
    getDepartmentAccessibleCollections,
    hasDepartmentAccessToCollection,
    logAction,
    isAdmin,
    isComplianceOfficer,
    isDepartmentManager,
    hasRole
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
}

export function useEnterprise() {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
}
