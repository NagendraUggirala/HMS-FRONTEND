import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Modal from "../../../../components/common/Modal/Modal";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from "xlsx";
import { apiFetch } from '../../../../services/apiClient';
import {
  API_BASE_URL,
  SUPER_ADMIN_HOSPITALS,
  SUPER_ADMIN_HOSPITAL_SUBSCRIPTION,
  SUPER_ADMIN_SUPPORT_TICKETS,
  SUPER_ADMIN_SUBSCRIPTION_ANALYTICS,
  SUPER_ADMIN_FINANCIAL_ANALYTICS,
  SUPER_ADMIN_PERFORMANCE_ANALYTICS,
  SUPER_ADMIN_DASHBOARD_OVERVIEW_CARDS,
  SUPER_ADMIN_ANALYTICS_OVERVIEW,
  SUPER_ADMIN_SUBSCRIPTION_PLANS,
} from "../../../../config/api";

const ReportsAnalytics = () => {
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  // State Management for Super Admin
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [activeCard, setActiveCard] = useState(null);
  const [showSubscriptionTable, setShowSubscriptionTable] = useState(false);
// Add these state variables
const [chartUpdateStatus, setChartUpdateStatus] = useState({
  subscriptionGrowthUpdated: false,
  planDistributionUpdated: false,
  revenueTrendsUpdated: false
});

// Add near other state declarations
const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
const [yearlyChartData, setYearlyChartData] = useState({});

const [lastUpdateSource, setLastUpdateSource] = useState(null);

  // Add these state variables near your other state declarations
  const [financialReports, setFinancialReports] = useState([]);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState("");
  const [customServices, setCustomServices] = useState([]);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [performanceReports, setPerformanceReports] = useState([]);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);

  const [subscriptionReports, setSubscriptionReports] = useState([]);
  const [hospitalList, setHospitalList] = useState([]);
  const [planList, setPlanList] = useState([]);
  // Super Admin Dashboard Metrics
  const [platformMetrics, setPlatformMetrics] = useState({
    subscription: {
      totalHospitals: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      newSubscriptions: 0,
      revenueGrowth: 0,
    },
    financial: {
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      collectionRate: 0,
    },
    performance: {
      platformUptime: 0,
      apiResponseTime: 0,
      customerSatisfaction: 0,
      supportResolutionRate: 0,
      featureAdoption: 0,
    },
    usage: {
      activeUsers: 0,
      dailyLogins: 0,
      apiCalls: 0,
      dataStorage: 0,
      bandwidthUsage: 0,
    },
  });

  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date(),
  });

  const [filters, setFilters] = useState({
    reportType: "all",
    subscriptionPlan: "all",
    status: "all",
    searchQuery: "",
  });

  // Modal states
  const [isGenerateReportModalOpen, setIsGenerateReportModalOpen] =
    useState(false);
  const [isViewReportModalOpen, setIsViewReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [newReport, setNewReport] = useState({
    title: "",
    type: "subscription",

    // Subscription
    hospitalName: "",
    planType: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    status: "",
    billingCycle: "",
    amountPaid: "",
    renewalDate: "",
    autoRenewal: false,

    // Financial
    collectionRate: "",
    newRevenue: "",
    churnRevenue: "",
    upgradeRevenue: "",
    downgradeRevenue: "",
    arpu: "",
    ltv: "",
    totalInvoices: "",
    paidInvoices: "",
    pendingInvoices: "",
    failedPayments: "",
    invoiceId: "",
    invoiceDate: "",
    dueDate: "",
    paymentDate: "",
    amount: "",
    tax: "",
    discount: "",
    totalAmount: "",
    paymentStatus: "",
    paymentMethod: "",
    transactionId: "",
    gst: "",
    cgst: "",
    sgst: "",
    igst: "",

    // Performance
    hospitalId: "",
    servicesUsed: [],
    serviceStartDate: "",
    serviceEndDate: "",
    totalDuration: "",
    serviceStatus: "",
    hasIssue: false,
    issueTitle: "",
    issueReportedDate: "",
    issueDescription: "",
    resolutionStatus: "",
    hasUpgrade: false,
    upgradeType: "",
    upgradeDate: "",
    upgradeDescription: "",
    systemUptime: "",
    avgResponseTime: "",
    errorRate: "",
  });


  // Super Admin Analytics Data
  const [analyticsData, setAnalyticsData] = useState({
    revenueTrends: [],
    subscriptionGrowth: [],
    planDistribution: [],
    hospitalPerformance: [],
    platformUsage: [],
  });

  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      // 1. Dashboard Overview Cards
      const overviewResRaw = await apiFetch(`${SUPER_ADMIN_DASHBOARD_OVERVIEW_CARDS(30, 6)}`);
      const overviewRes = overviewResRaw.ok ? await overviewResRaw.json() : null;
      
      // 2. Performance Analytics (for Uptime and Satisfaction)
      const performanceResRaw = await apiFetch(SUPER_ADMIN_PERFORMANCE_ANALYTICS);
      const performanceRes = performanceResRaw.ok ? await performanceResRaw.json() : null;
      
      // Update platformMetrics with overview and performance data
      if (overviewRes?.data) {
        setPlatformMetrics(prev => ({
          ...prev,
          subscription: {
            ...prev.subscription,
            totalHospitals: overviewRes.data.subscription?.total_hospitals || prev.subscription.totalHospitals,
            activeSubscriptions: overviewRes.data.subscription?.active_subscriptions || prev.subscription.activeSubscriptions,
            churnRate: overviewRes.data.subscription?.churn_rate || prev.subscription.churnRate,
            newSubscriptions: overviewRes.data.subscription?.new_subscriptions || prev.subscription.newSubscriptions,
          },
          financial: {
            ...prev.financial,
            totalRevenue: overviewRes.data.financial?.total_revenue || prev.financial.totalRevenue,
            monthlyRecurringRevenue: overviewRes.data.financial?.mrr || prev.financial.monthlyRecurringRevenue,
            annualRecurringRevenue: overviewRes.data.financial?.arr || prev.financial.annualRecurringRevenue,
          }
        }));
      }

      if (performanceRes?.data) {
        setPlatformMetrics(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            platformUptime: performanceRes.data.metrics?.systemUptime || prev.performance.platformUptime,
            customerSatisfaction: performanceRes.data.metrics?.customerSatisfaction || prev.performance.customerSatisfaction,
          }
        }));
      }

      // Date Range payload
      const payload = {
        date_from: dateRange.startDate.toISOString(),
        date_to: dateRange.endDate.toISOString()
      };

      // 3. Subscription Analytics (Charts)
      const subAnalyticsResRaw = await apiFetch(SUPER_ADMIN_SUBSCRIPTION_ANALYTICS, {
        method: 'POST',
        body: payload
      });
      const subAnalyticsRes = subAnalyticsResRaw.ok ? await subAnalyticsResRaw.json() : null;

      // 4. Financial Analytics (Charts)
      const finAnalyticsResRaw = await apiFetch(SUPER_ADMIN_FINANCIAL_ANALYTICS, {
        method: 'POST',
        body: payload
      });
      const finAnalyticsRes = finAnalyticsResRaw.ok ? await finAnalyticsResRaw.json() : null;

      setAnalyticsData(prev => ({
        ...prev,
        subscriptionGrowth: subAnalyticsRes?.data?.growth_chart || prev.subscriptionGrowth,
        planDistribution: subAnalyticsRes?.data?.plan_distribution || prev.planDistribution,
        revenueTrends: finAnalyticsRes?.data?.revenue_trends || prev.revenueTrends,
      }));

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    fetchReports();
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    filterReports();
  }, [filters, reports]);




  // Add this useEffect to update platform metrics from performance reports
useEffect(() => {
  if (performanceReports.length === 0) return;

  // Calculate average performance metrics from all performance reports
  const totalUptime = performanceReports.reduce((sum, report) => {
    const uptime = parseFloat(report.metrics?.systemUptime) || 0;
    return sum + uptime;
  }, 0);
  
  const avgUptime = performanceReports.length > 0 
    ? (totalUptime / performanceReports.length).toFixed(1) 
    : platformMetrics.performance.platformUptime;

  // Calculate average response time (lower is better, affects satisfaction)
  const totalResponseTime = performanceReports.reduce((sum, report) => {
    const responseTime = parseFloat(report.metrics?.avgResponseTime) || 0;
    return sum + responseTime;
  }, 0);
  const avgResponseTime = performanceReports.length > 0 
    ? (totalResponseTime / performanceReports.length).toFixed(0) 
    : platformMetrics.performance.apiResponseTime;

  // Calculate customer satisfaction based on:
  // - Uptime (higher = better)
  // - Response time (lower = better)
  // - Error rate (lower = better)
  // - Issue resolution status
  let satisfactionScore = platformMetrics.performance.customerSatisfaction;
  
  if (performanceReports.length > 0) {
    let totalScore = 0;
    performanceReports.forEach(report => {
      let score = 4.0; // Base score
      
      // Uptime contribution (max 1 point)
      const uptime = parseFloat(report.metrics?.systemUptime) || 0;
      if (uptime >= 99.9) score += 0.5;
      else if (uptime >= 99) score += 0.3;
      else if (uptime >= 95) score += 0.1;
      
      // Response time contribution (max 0.5 points)
      const responseTime = parseFloat(report.metrics?.avgResponseTime) || 0;
      if (responseTime <= 100) score += 0.5;
      else if (responseTime <= 200) score += 0.3;
      else if (responseTime <= 300) score += 0.1;
      
      // Error rate contribution (max 0.5 points)
      const errorRate = parseFloat(report.metrics?.errorRate) || 0;
      if (errorRate <= 0.1) score += 0.5;
      else if (errorRate <= 0.5) score += 0.3;
      else if (errorRate <= 1) score += 0.1;
      
      // Issue resolution (max 0.5 points)
      if (!report.hasIssue) score += 0.3;
      else if (report.issueDetails?.resolutionStatus === 'resolved') score += 0.2;
      else if (report.issueDetails?.resolutionStatus === 'in_progress') score += 0.1;
      
      // Upgrade bonus (max 0.2 points)
      if (report.hasUpgrade) score += 0.2;
      
      totalScore += Math.min(score, 5.0); // Cap at 5.0
    });
    satisfactionScore = (totalScore / performanceReports.length).toFixed(1);
  }

  setPlatformMetrics(prev => ({
    ...prev,
    performance: {
      ...prev.performance,
      platformUptime: parseFloat(avgUptime),
      apiResponseTime: parseInt(avgResponseTime),
      customerSatisfaction: parseFloat(satisfactionScore)
    }
  }));
}, [performanceReports]);



// Add these helper functions to calculate percentage changes
const calculateUptimeChange = () => {
  if (performanceReports.length < 2) return 0;
  const current = performanceReports[0]?.metrics?.systemUptime || 0;
  const previous = performanceReports[1]?.metrics?.systemUptime || 0;
  return parseFloat((current - previous).toFixed(1));
};

const calculateSatisfactionChange = () => {
  if (performanceReports.length < 2) return 0;
  let currentSatisfaction = 0;
  let previousSatisfaction = 0;
  
  if (performanceReports[0]?.calculatedSatisfaction) {
    currentSatisfaction = parseFloat(performanceReports[0].calculatedSatisfaction);
  }
  if (performanceReports[1]?.calculatedSatisfaction) {
    previousSatisfaction = parseFloat(performanceReports[1].calculatedSatisfaction);
  }
  
  return parseFloat((currentSatisfaction - previousSatisfaction).toFixed(1));
};

const getChartSourceName = (reportType) => {
  switch(reportType) {
    case "subscription":
      return "Core Subscription Data → Subscription Growth & Plan Distribution";
    case "financial":
      return "Hospital & Plan Details → Platform Revenue Trends";
    case "performance":
      return "Hospital Information → Platform Revenue Trends";
    default:
      return "Unknown";
  }
};

  // Add this function to handle time period change
const handleTimePeriodChange = (period) => {
  setTimePeriod(period);
  const now = new Date();
  let start = new Date();
  if (period === 'monthly') {
    start.setMonth(now.getMonth() - 1);
  } else if (period === 'quarterly') {
    start.setMonth(now.getMonth() - 3);
  } else if (period === 'yearly') {
    start.setFullYear(now.getFullYear() - 1);
  }
  setDateRange({ startDate: start, endDate: now });
};

  const fetchDropdownData = async () => {
    try {
      const [hospitalsResRaw, plansResRaw] = await Promise.all([
        apiFetch(`${SUPER_ADMIN_HOSPITALS}?page=1&limit=100`),
        apiFetch(SUPER_ADMIN_SUBSCRIPTION_PLANS)
      ]);

      if (hospitalsResRaw.ok) {
        const response = await hospitalsResRaw.json();
        const raw = response?.data ?? response;
        const hospitals = Array.isArray(raw?.items) ? raw.items : 
                          Array.isArray(raw?.hospitals) ? raw.hospitals : 
                          Array.isArray(raw) ? raw : [];
        setHospitalList(hospitals);
      }

      if (plansResRaw.ok) {
        const response = await plansResRaw.json();
        const raw = response?.data ?? response;
        const plans = Array.isArray(raw?.items) ? raw.items : 
                      Array.isArray(raw?.plans) ? raw.plans : 
                      Array.isArray(raw) ? raw : [];
        setPlanList(plans);
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };


  const fetchReports = async () => {
    try {
      const responseRaw = await apiFetch(SUPER_ADMIN_ANALYTICS_OVERVIEW);
      if (responseRaw.ok) {
        const response = await responseRaw.json();
        if (response && response.data) {
          setReports(response.data.reports || []);
          setFilteredReports(response.data.reports || []);
        } else {
          setReports([]);
          setFilteredReports([]);
        }
      } else {
        setReports([]);
        setFilteredReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch reports list:', error);
      setReports([]);
      setFilteredReports([]);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (filters.reportType !== "all") {
      filtered = filtered.filter(
        (report) => report.type === filters.reportType,
      );
    }

    if (filters.subscriptionPlan !== "all") {
      filtered = filtered.filter(
        (report) => report.planType === filters.subscriptionPlan,
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((report) => report.status === filters.status);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(query) ||
          report.description.toLowerCase().includes(query) ||
          report.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          report.id.toLowerCase().includes(query),
      );
    }

    setFilteredReports(filtered);
  };

  // Report Generation Functions
const openGenerateReportModal = () => {
  resetNewReportForm();   // ✅ CLEAR DATA FIRST
  setIsGenerateReportModalOpen(true);
};

  const closeGenerateReportModal = () => {
    setIsGenerateReportModalOpen(false);
    setNewReport({
      title: "",
      type: "subscription",
      planType: "all",
      format: "PDF",
      timeframe: "last_30_days",
      includeCharts: true,
      includeData: true,
      emailNotification: false,
      schedule: false,
      recipients: [],
    });
  };

// Replace existing chart update functions with these enhanced versions
const updateSubscriptionGrowthChart = (subscriptionData) => {
  const currentMonth = new Date().toLocaleString('default', { month: 'short' });
  
  const year = currentYear;
  const isNewHospital = subscriptionData.status === "active";
  setAnalyticsData(prev => {
    // Get existing data for the current year
    const existingData = prev.subscriptionGrowth.filter(item => item.year === year);   
    const monthIndex = existingData.findIndex(item => item.month === currentMonth);
    let updatedData;
    if (monthIndex >= 0) {
      updatedData = [...existingData];
      updatedData[monthIndex] = {
        ...updatedData[monthIndex],
        newHospitals: isNewHospital ? updatedData[monthIndex].newHospitals + 1 : updatedData[monthIndex].newHospitals,
        churnedHospitals: !isNewHospital ? updatedData[monthIndex].churnedHospitals + 1 : updatedData[monthIndex].churnedHospitals,
        netGrowth: isNewHospital ? updatedData[monthIndex].netGrowth + 1 : updatedData[monthIndex].netGrowth - 1,
        year: year
      };
    } else {
      updatedData = [
        ...existingData,
        {
          month: currentMonth,
          newHospitals: isNewHospital ? 1 : 0,
          churnedHospitals: !isNewHospital ? 1 : 0,
          upgradedPlans: 0,
          downgradedPlans: 0,
          netGrowth: isNewHospital ? 1 : -1,
          year: year
        }
      ];
    }
    // Sort by month order
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    updatedData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    
    // Update cache
    setYearlyChartData(prevCache => ({
      ...prevCache,
      [year]: {
        ...prevCache[year],
        subscriptionGrowth: updatedData
      }
    }));
    
    return { ...prev, subscriptionGrowth: updatedData };
  });  
  setChartUpdateStatus(prev => ({ ...prev, subscriptionGrowthUpdated: true }));
};

// Update Plan Distribution Chart (from Core Subscription Data)
const updatePlanDistributionChart = (subscriptionData) => {
  const year = currentYear;
  
  setAnalyticsData(prev => {
    const planIndex = prev.planDistribution.findIndex(
      plan => plan.plan === subscriptionData.planType
    );
    
    if (planIndex >= 0) {
      const updatedPlans = [...prev.planDistribution];
      updatedPlans[planIndex] = {
        ...updatedPlans[planIndex],
        hospitals: updatedPlans[planIndex].hospitals + 1,
        revenue: updatedPlans[planIndex].revenue + (parseInt(subscriptionData.amountPaid) || 0),
        yearData: {
          ...updatedPlans[planIndex].yearData,
          [year]: {
            hospitals: (updatedPlans[planIndex].yearData?.[year]?.hospitals || 0) + 1,
            revenue: (updatedPlans[planIndex].yearData?.[year]?.revenue || 0) + (parseInt(subscriptionData.amountPaid) || 0)
          }
        }
      };
      return { ...prev, planDistribution: updatedPlans };
    }
    return prev;
  });
  
  setChartUpdateStatus(prev => ({ ...prev, planDistributionUpdated: true }));
};

// Update Revenue Trends Chart (from Hospital & Plan Details - Financial)
const updateRevenueTrendsChart = (financialData) => {
  const currentMonth = new Date().toLocaleString('default', { month: 'short' });
  const year = currentYear;
  const amount = parseInt(financialData.amount) || 0;
  const newRevenue = parseInt(financialData.newRevenue) || 0;
  const churnRevenue = parseInt(financialData.churnRevenue) || 0;

  setAnalyticsData(prev => {
    const existingData = prev.revenueTrends.filter(item => item.year === year);
    const monthIndex = existingData.findIndex(item => item.month === currentMonth);
    
    let updatedData;
    if (monthIndex >= 0) {
      updatedData = [...existingData];
      updatedData[monthIndex] = {
        ...updatedData[monthIndex],
        mrr: updatedData[monthIndex].mrr + amount,
        newRevenue: updatedData[monthIndex].newRevenue + newRevenue,
        churnRevenue: updatedData[monthIndex].churnRevenue + churnRevenue,
        netRevenue: (updatedData[monthIndex].mrr + amount) - 
                    (updatedData[monthIndex].churnRevenue + churnRevenue) + 
                    (updatedData[monthIndex].newRevenue + newRevenue),
        year: year
      };
    } else {
      updatedData = [
        ...existingData,
        {
          month: currentMonth,
          mrr: amount,
          arr: amount * 12,
          newRevenue: newRevenue,
          churnRevenue: churnRevenue,
          netRevenue: amount - churnRevenue + newRevenue,
          year: year
        }
      ];
    }
    
    // Sort by month order
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    updatedData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    
    // Update cache
    setYearlyChartData(prevCache => ({
      ...prevCache,
      [year]: {
        ...prevCache[year],
        revenueTrends: updatedData
      }
    }));
    
    return { ...prev, revenueTrends: updatedData };
  });
  
  setChartUpdateStatus(prev => ({ ...prev, revenueTrendsUpdated: true }));
};

// Update Revenue Trends from Performance Data (Hospital Information)
const updateRevenueTrendsFromPerformance = (performanceData) => {
  // Performance metrics affect revenue indirectly through uptime and satisfaction
  const currentMonth = new Date().toLocaleString('default', { month: 'short' });
  const uptime = parseFloat(performanceData.metrics?.systemUptime) || 0;
  const responseTime = parseFloat(performanceData.metrics?.avgResponseTime) || 0;
  
  // Calculate performance impact on revenue (0 to 50000 based on metrics)
  let performanceImpact = 0;
  if (uptime >= 99.9) performanceImpact += 25000;
  else if (uptime >= 99) performanceImpact += 15000;
  else if (uptime >= 95) performanceImpact += 5000;
  
  if (responseTime <= 100) performanceImpact += 15000;
  else if (responseTime <= 200) performanceImpact += 10000;
  else if (responseTime <= 300) performanceImpact += 5000;

  setAnalyticsData(prev => {
    const existingData = [...prev.revenueTrends];
    const monthIndex = existingData.findIndex(item => item.month === currentMonth);
    
    if (monthIndex >= 0) {
      const updated = [...existingData];
      updated[monthIndex] = {
        ...updated[monthIndex],
        mrr: updated[monthIndex].mrr + performanceImpact,
        netRevenue: updated[monthIndex].netRevenue + performanceImpact
      };
      return { ...prev, revenueTrends: updated };
    }
    return prev;
  });
  
  setChartUpdateStatus(prev => ({ ...prev, revenueTrendsUpdated: true }));
};

const handleGenerateReport = async (e) => {
  e.preventDefault();

  if (!newReport.title.trim()) {
    alert("Please enter a report title");
    return;
  }

  // Check if charts should be updated based on checkbox
  const shouldUpdateCharts = newReport.includeCharts === true;

  // Validate required fields based on report type
  if (newReport.type === "subscription") {
    if (!newReport.hospitalName || newReport.hospitalName === "select") {
      alert("Please select a Hospital Name");
      return;
    }
    if (!newReport.amountPaid) {
      alert("Please enter Amount Paid");
      return;
    }
  }

  if (newReport.type === "financial") {
    if (!newReport.hospitalName || newReport.hospitalName === "select") {
      alert("Please select a Hospital Name");
      return;
    }
    if (!newReport.amount) {
      alert("Please enter Amount");
      return;
    }
  }

  if (newReport.type === "performance") {
    if (!newReport.hospitalId) {
      alert("Please select a hospital");
      return;
    }
    if (!newReport.servicesUsed || newReport.servicesUsed.length === 0) {
      alert("Please select at least one service");
      return;
    }
    if (!newReport.serviceStartDate) {
      alert("Please select service start date");
      return;
    }
  }

  // Prepare report data
  let reportData = {};

  if (newReport.type === "subscription") {
    reportData = {
      hospitalName: newReport.hospitalName,
      planType: newReport.planType,
      subscriptionStartDate: newReport.subscriptionStartDate,
      subscriptionEndDate: newReport.subscriptionEndDate,
      status: newReport.status,
      billingCycle: newReport.billingCycle,
      amountPaid: newReport.amountPaid,
      renewalDate: newReport.renewalDate,
      autoRenewal: newReport.autoRenewal,
    };

    const subscriptionEntry = {
      id: `SUB-${Date.now()}`,
      generatedDate: new Date().toISOString().split("T")[0],
      title: newReport.title,
      ...reportData,
    };

    setSubscriptionReports((prev) => [subscriptionEntry, ...prev]);
    setIsSubscriptionModalOpen(true);

    // UPDATE CHARTS ONLY if checkbox is checked
    if (shouldUpdateCharts) {
      updateSubscriptionGrowthChart(subscriptionEntry);
      updatePlanDistributionChart(subscriptionEntry);
      setLastUpdateSource("Core Subscription Data");
      setChartUpdateStatus(prev => ({ 
        ...prev, 
        subscriptionGrowthUpdated: true,
        planDistributionUpdated: true 
      }));
      
      // Show success message for chart update
      setTimeout(() => {
        alert(`✅ Charts updated successfully!\n\nSource: Core Subscription Data\nAffected Charts: Subscription Growth & Plan Distribution\nPeriod: ${timePeriod} - ${currentYear}`);
      }, 500);
    }
  }

  if (newReport.type === "financial") {
    const financialReport = {
      id: `FIN-${Date.now()}`,
      type: "financial",
      hospitalName: newReport.hospitalName,
      planType: newReport.planType,
      billingCycle: newReport.billingCycle,
      collectionRate: newReport.collectionRate,
      newRevenue: newReport.newRevenue,
      churnRevenue: newReport.churnRevenue,
      upgradeRevenue: newReport.upgradeRevenue,
      downgradeRevenue: newReport.downgradeRevenue,
      arpu: newReport.arpu,
      ltv: newReport.ltv,
      totalInvoices: newReport.totalInvoices,
      paidInvoices: newReport.paidInvoices,
      pendingInvoices: newReport.pendingInvoices,
      failedPayments: newReport.failedPayments,
      invoiceId: newReport.invoiceId,
      invoiceDate: newReport.invoiceDate,
      dueDate: newReport.dueDate,
      paymentDate: newReport.paymentDate,
      amount: newReport.amount,
      tax: newReport.tax,
      discount: newReport.discount,
      totalAmount: newReport.totalAmount,
      paymentStatus: newReport.paymentStatus,
      paymentMethod: newReport.paymentMethod,
      transactionId: newReport.transactionId,
      gst: newReport.gst,
      cgst: newReport.cgst,
      sgst: newReport.sgst,
      igst: newReport.igst,
      generatedDate: new Date().toISOString().split("T")[0],
      status: "completed",
    };

    setFinancialReports((prev) => [financialReport, ...prev]);
    setIsFinancialModalOpen(true);

    // UPDATE CHARTS ONLY if checkbox is checked
    if (shouldUpdateCharts) {
      updateRevenueTrendsChart(financialReport);
      setLastUpdateSource("Hospital & Plan Details");
      setChartUpdateStatus(prev => ({ ...prev, revenueTrendsUpdated: true }));
      
      setTimeout(() => {
        alert(`Charts updated successfully!\n\nSource: Hospital & Plan Details\nAffected Charts: Platform Revenue Trends\nPeriod: ${timePeriod} - ${currentYear}`);
      }, 500);
    }

    alert(`Financial report for ${newReport.hospitalName} generated successfully!`);
  }

  if (newReport.type === "performance") {
    const hospitalSelect = document.querySelector('select[name="hospitalId"]');
    const selectedOption = hospitalSelect?.options[hospitalSelect.selectedIndex];
    const hospitalName = selectedOption?.text.split(" (")[0] || "Unknown Hospital";

    const performanceReport = {
      id: `PERF-${Date.now()}`,
      type: "performance",
      hospitalId: newReport.hospitalId,
      hospitalName: hospitalName,
      servicesUsed: newReport.servicesUsed,
      serviceStartDate: newReport.serviceStartDate,
      serviceEndDate: newReport.serviceEndDate,
      totalDuration: newReport.totalDuration,
      serviceStatus: newReport.serviceStatus,
      hasIssue: newReport.hasIssue,
      issueDetails: newReport.hasIssue
        ? {
            title: newReport.issueTitle,
            reportedDate: newReport.issueReportedDate,
            description: newReport.issueDescription,
            resolutionStatus: newReport.resolutionStatus,
          }
        : null,
      hasUpgrade: newReport.hasUpgrade,
      upgradeDetails: newReport.hasUpgrade
        ? {
            type: newReport.upgradeType,
            date: newReport.upgradeDate,
            description: newReport.upgradeDescription,
          }
        : null,
      metrics: {
        systemUptime: newReport.systemUptime,
        avgResponseTime: newReport.avgResponseTime,
        errorRate: newReport.errorRate,
      },
      generatedDate: new Date().toISOString().split("T")[0],
      status: "completed",
      title: newReport.title,
    };

    setPerformanceReports((prev) => [performanceReport, ...prev]);

    //  UPDATE CHARTS ONLY if checkbox is checked
    if (shouldUpdateCharts) {
      updateRevenueTrendsFromPerformance(performanceReport);
      setLastUpdateSource("Hospital Information");
      setChartUpdateStatus(prev => ({ ...prev, revenueTrendsUpdated: true }));
      
      setTimeout(() => {
        alert(`Charts updated successfully!\n\nSource: Hospital Information\nAffected Charts: Platform Revenue Trends (Performance Impact)\nPeriod: ${timePeriod} - ${currentYear}`);
      }, 500);
    }

    alert(`Performance report for ${hospitalName} generated successfully!`);
  }

  // Create main report
  const report = {
    id: `REP-SA-${Date.now()}`,
    title: newReport.title,
    type: newReport.type,
    planType: newReport.planType || "all",
    format: newReport.format,
    generatedDate: new Date().toISOString().split("T")[0],
    status: "processing",
    size: "0 MB",
    records: 0,
    chartsIncluded: shouldUpdateCharts ? getDefaultChartsForType(newReport.type) : [],
    scheduled: newReport.schedule,
    tags: [
      newReport.type,
      newReport.planType || "all",
      "generated",
      newReport.timeframe,
    ],
    description: `Generated ${newReport.type} report for ${newReport.timeframe} timeframe`,
    lastAccessed: null,
    downloadCount: 0,
    reportData: reportData,
    timeframe: newReport.timeframe,
    includeCharts: shouldUpdateCharts,
    includeData: newReport.includeData,
    emailNotification: newReport.emailNotification,
  };

  setReports((prev) => [report, ...prev]);

  // Simulate processing
  setTimeout(() => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              status: "completed",
              size: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
              records: Math.floor(Math.random() * 500) + 100,
            }
          : r,
      ),
    );

    let successMessage = ` Super Admin Report "${report.title}" has been generated successfully.\n\n`;
    successMessage += `Report Summary:\n`;
    successMessage += `Type: ${newReport.type.toUpperCase()}\n`;
    successMessage += `Timeframe: ${newReport.timeframe}\n`;
    successMessage += `Format: ${newReport.format}\n`;
    
    if (shouldUpdateCharts) {
      successMessage += `\nCharts Updated: YES\n`;
      successMessage += `   Source: ${getChartSourceName(newReport.type)}\n`;
      successMessage += `   Period: ${timePeriod} - ${currentYear}\n`;
    } else {
      successMessage += `\nCharts Updated: NO\n`;
      successMessage += `   (Enable "Include Charts & Graphs" to update visualizations)\n`;
    }

    if (newReport.type === "subscription" && newReport.hospitalName) {
      successMessage += `\nHospital: ${newReport.hospitalName}\n`;
      successMessage += `Plan: ${newReport.planType}\n`;
      successMessage += `Amount: ₹${newReport.amountPaid}\n`;
    }

    if (newReport.type === "financial") {
      successMessage += `\nHospital: ${newReport.hospitalName}\n`;
      successMessage += `Amount: ₹${newReport.amount}\n`;
      if (newReport.newRevenue) successMessage += `New Revenue: ₹${newReport.newRevenue}\n`;
      if (newReport.churnRevenue) successMessage += `Churn Revenue: ₹${newReport.churnRevenue}\n`;
    }

    if (newReport.type === "performance") {
      const hospitalName = document.querySelector('select[name="hospitalId"] option:checked')?.text.split(" (")[0] || "Unknown";
      successMessage += `\nHospital: ${hospitalName}\n`;
      successMessage += `Services: ${newReport.servicesUsed?.join(", ")}\n`;
      successMessage += `Status: ${newReport.serviceStatus}\n`;
      if (newReport.systemUptime) successMessage += `System Uptime: ${newReport.systemUptime}%\n`;
      if (newReport.avgResponseTime) successMessage += `Response Time: ${newReport.avgResponseTime}ms\n`;
    }

    alert(successMessage);
  }, 2000);

  closeGenerateReportModal();
resetNewReportForm();   //  important
};
  // Add this component before the return statement
  const SubscriptionReportsTable = () => {
    const downloadInvoice = (report) => {
      // Create invoice HTML content
      const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${report.hospitalName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 8px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #3B82F6;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
          }
          .invoice-details {
            margin: 20px 0;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .invoice-table th, .invoice-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .invoice-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .total-section {
            margin-top: 20px;
            text-align: right;
            font-size: 18px;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-active {
            background-color: #d4edda;
            color: #155724;
          }
          .status-inactive {
            background-color: #f8d7da;
            color: #721c24;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="company-name">Healthcare Platform</div>
            <div>Subscription Invoice</div>
          </div>
          
          <div class="invoice-title">INVOICE</div>
          
          <div class="invoice-details">
            <p><strong>Invoice ID:</strong> ${report.id}</p>
            <p><strong>Date:</strong> ${report.generatedDate}</p>
            <p><strong>Hospital Name:</strong> ${report.hospitalName}</p>
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Plan Type</td>
                <td>${report.planType}</td>
              </tr>
              <tr>
                <td>Billing Cycle</td>
                <td>${report.billingCycle}</td>
              </tr>
              <tr>
                <td>Subscription Period</td>
                <td>${report.subscriptionStartDate || "N/A"} to ${report.subscriptionEndDate || "N/A"}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td>
                  <span class="status-badge ${report.status === "active" ? "status-active" : "status-inactive"}">
                    ${report.status.toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td>Auto Renewal</td>
                <td>${report.autoRenewal ? "Yes" : "No"}</td>
              </tr>
              <tr>
                <td>Renewal Date</td>
                <td>${report.renewalDate || "N/A"}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total-section">
            <p>Total Amount: ₹${parseInt(report.amountPaid).toLocaleString("en-IN")}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing our services!</p>
            <p>For any queries, please contact support@healthcareplatform.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

      // Create blob and download
      const blob = new Blob([invoiceHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${report.hospitalName.replace(/\s+/g, "_")}_${report.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(
        `📄 Invoice for ${report.hospitalName} has been downloaded successfully!`,
      );
    };

    const deleteSubscriptionReport = (reportId) => {
      if (
        window.confirm(
          "Are you sure you want to delete this subscription report?",
        )
      ) {
        setSubscriptionReports((prev) => prev.filter((r) => r.id !== reportId));
        alert("🗑️ Subscription report deleted successfully");
      }
    };

    if (subscriptionReports.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <i className="fas fa-file-invoice text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500">No subscription reports generated yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click on "Subscription Analytics" card to generate your first report
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                Subscription Reports
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Total Reports: {subscriptionReports.length}
              </p>
            </div>
            <button
              onClick={() => {
                const allData = subscriptionReports.map((r) => ({
                  "Hospital Name": r.hospitalName,
                  "Plan Type": r.planType,
                  Status: r.status,
                  "Billing Cycle": r.billingCycle,
                  "Amount Paid": r.amountPaid,
                  "Start Date": r.subscriptionStartDate,
                  "End Date": r.subscriptionEndDate,
                  "Renewal Date": r.renewalDate,
                  "Auto Renewal": r.autoRenewal ? "Yes" : "No",
                  "Generated Date": r.generatedDate,
                }));
                const ws = XLSX.utils.json_to_sheet(allData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Subscription Reports");
                XLSX.writeFile(
                  wb,
                  `Subscription_Reports_${new Date().toISOString().split("T")[0]}.xlsx`,
                );
              }}
              className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
            >
              <i className="fas fa-download mr-2"></i>
              Export All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hospital Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Billing Cycle
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auto Renewal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptionReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {report.hospitalName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.planType === "Enterprise"
                          ? "bg-purple-100 text-purple-700"
                          : report.planType === "Professional"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {report.planType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === "active"
                          ? "bg-green-100 text-green-700"
                          : report.status === "inactive"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <i
                        className={`fas ${
                          report.status === "active"
                            ? "fa-check-circle"
                            : report.status === "inactive"
                              ? "fa-times-circle"
                              : "fa-exclamation-circle"
                        } mr-1 text-xs`}
                      ></i>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm capitalize text-gray-600">
                    {report.billingCycle}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    ₹{parseInt(report.amountPaid).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {report.subscriptionStartDate || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {report.subscriptionEndDate || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {report.autoRenewal ? (
                      <span className="text-green-600">
                        <i className="fas fa-check-circle mr-1"></i> Yes
                      </span>
                    ) : (
                      <span className="text-red-600">
                        <i className="fas fa-times-circle mr-1"></i> No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadInvoice(report)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download Invoice"
                      >
                        <i className="fas fa-file-invoice"></i>
                      </button>
                      <button
                        onClick={() => deleteSubscriptionReport(report.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Add this component before your ReportsAnalytics component or in a separate file
  const FinancialReportsTable = ({ reports = [], onDelete }) => {
    const downloadInvoice = (report) => {
      const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Invoice - ${report.hospitalName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f0f2f5;
            padding: 40px;
          }
          .invoice-wrapper {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .invoice-header {
            color: black;
            padding: 30px;
            text-align: center;
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .invoice-title {
            font-size: 20px;
            opacity: 0.9;
          }
          .invoice-body {
            padding: 30px;
          }
          .hospital-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: 600;
            color: #4b5563;
          }
          .info-value {
            color: #1f2937;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
          }
          .financial-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .financial-table th,
          .financial-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          .financial-table th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          .amount-highlight {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fed7aa; color: #92400e; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          .invoice-footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { background: white; padding: 0; }
            .invoice-wrapper { box-shadow: none; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-wrapper">
          <div class="invoice-header">
            <div class="company-name">Healthcare Platform</div>
            <div class="invoice-title">Financial Statement & Invoice</div>
          </div>
          
          <div class="invoice-body">
            <div class="hospital-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Hospital Name:</span>
                  <span class="info-value">${report.hospitalName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Invoice ID:</span>
                  <span class="info-value">${report.invoiceId || report.id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Plan Type:</span>
                  <span class="info-value">${report.planType}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Billing Cycle:</span>
                  <span class="info-value">${report.billingCycle}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Invoice Date:</span>
                  <span class="info-value">${report.invoiceDate || report.generatedDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Due Date:</span>
                  <span class="info-value">${report.dueDate || "N/A"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Status:</span>
                  <span class="info-value">
                    <span class="status-badge status-${report.paymentStatus}">
                      ${report.paymentStatus.toUpperCase()}
                    </span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${report.paymentMethod}</span>
                </div>
              </div>
            </div>

            <div class="section-title">💰 Revenue Breakdown</div>
            <table class="financial-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base Amount</td>
                  <td>₹${parseInt(report.amount || 0).toLocaleString("en-IN")}</td>
                </tr>
                ${
                  report.newRevenue
                    ? `
                <tr>
                  <td>New Revenue</td>
                  <td class="text-green-600">+ ₹${parseInt(report.newRevenue).toLocaleString("en-IN")}</td>
                </tr>
                `
                    : ""
                }
                ${
                  report.churnRevenue
                    ? `
                <tr>
                  <td>Churn Revenue</td>
                  <td class="text-red-600">- ₹${parseInt(report.churnRevenue).toLocaleString("en-IN")}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td>Tax (GST)</td>
                  <td>₹${parseInt(report.tax || report.gst || 0).toLocaleString("en-IN")}</td>
                </tr>
                ${
                  report.discount
                    ? `
                <tr>
                  <td>Discount</td>
                  <td class="text-green-600">- ₹${parseInt(report.discount).toLocaleString("en-IN")}</td>
                </tr>
                `
                    : ""
                }
                <tr style="border-top: 2px solid #e5e7eb; font-weight: bold;">
                  <td>Total Amount</td>
                  <td class="amount-highlight">₹${parseInt(report.totalAmount || report.amount || 0).toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            ${
              report.cgst || report.sgst
                ? `
            <div class="section-title">📋 GST Breakdown</div>
            <table class="financial-table">
              <thead>
                <tr>
                  <th>Tax Component</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${report.cgst ? `<tr><td>CGST (9%)</td><td>₹${parseInt(report.cgst).toLocaleString("en-IN")}</td></tr>` : ""}
                ${report.sgst ? `<tr><td>SGST (9%)</td><td>₹${parseInt(report.sgst).toLocaleString("en-IN")}</td></tr>` : ""}
                ${report.igst ? `<tr><td>IGST</td><td>₹${parseInt(report.igst).toLocaleString("en-IN")}</td></tr>` : ""}
              </tbody>
            </table>
            `
                : ""
            }

            <div class="section-title">📊 Key Metrics</div>
            <table class="financial-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                ${report.arpu ? `<tr><td>ARPU (Avg Revenue Per User)</td><td>₹${parseInt(report.arpu).toLocaleString("en-IN")}</td></tr>` : ""}
                ${report.ltv ? `<tr><td>LTV (Lifetime Value)</td><td>₹${parseInt(report.ltv).toLocaleString("en-IN")}</td></tr>` : ""}
                ${report.collectionRate ? `<tr><td>Collection Rate</td><td>${report.collectionRate}%</td></tr>` : ""}
                ${report.totalInvoices ? `<tr><td>Total Invoices</td><td>${report.totalInvoices}</td></tr>` : ""}
                ${report.paidInvoices ? `<tr><td>Paid Invoices</td><td>${report.paidInvoices}</td></tr>` : ""}
              </tbody>
            </table>

            <div class="section-title">💳 Transaction Details</div>
            <table class="financial-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Transaction ID</td><td>${report.transactionId || "N/A"}</td></tr>
                <tr><td>Payment Date</td><td>${report.paymentDate || "N/A"}</td></tr>
                <tr><td>Payment Method</td><td>${report.paymentMethod}</td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="invoice-footer">
            <p>Thank you for choosing Healthcare Platform!</p>
            <p>For any queries, please contact finance@healthcareplatform.com</p>
            <p style="margin-top: 10px;">Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            🖨️ Print Invoice
          </button>
        </div>
      </body>
      </html>
    `;

      const blob = new Blob([invoiceHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Financial_Invoice_${report.hospitalName.replace(/\s+/g, "_")}_${report.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(
        `📄 Financial invoice for ${report.hospitalName} has been downloaded successfully!`,
      );
    };

    const exportToExcel = () => {
      const allData = financialReports.map((r) => ({
        "Hospital Name": r.hospitalName,
        "Plan Type": r.planType,
        "Billing Cycle": r.billingCycle,
        "Collection Rate": r.collectionRate ? `${r.collectionRate}%` : "N/A",
        "New Revenue": r.newRevenue
          ? `₹${parseInt(r.newRevenue).toLocaleString("en-IN")}`
          : "N/A",
        "Churn Revenue": r.churnRevenue
          ? `₹${parseInt(r.churnRevenue).toLocaleString("en-IN")}`
          : "N/A",
        ARPU: r.arpu ? `₹${parseInt(r.arpu).toLocaleString("en-IN")}` : "N/A",
        LTV: r.ltv ? `₹${parseInt(r.ltv).toLocaleString("en-IN")}` : "N/A",
        "Total Invoices": r.totalInvoices || "N/A",
        "Paid Invoices": r.paidInvoices || "N/A",
        "Pending Invoices": r.pendingInvoices || "N/A",
        "Failed Payments": r.failedPayments || "N/A",
        Amount: r.amount
          ? `₹${parseInt(r.amount).toLocaleString("en-IN")}`
          : "N/A",
        Tax: r.tax ? `₹${parseInt(r.tax).toLocaleString("en-IN")}` : "N/A",
        "Total Amount": r.totalAmount
          ? `₹${parseInt(r.totalAmount).toLocaleString("en-IN")}`
          : "N/A",
        "Payment Status": r.paymentStatus,
        "Payment Method": r.paymentMethod,
        "Transaction ID": r.transactionId || "N/A",
        "Invoice ID": r.invoiceId || r.id,
        "Generated Date": r.generatedDate,
      }));

      const ws = XLSX.utils.json_to_sheet(allData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Financial Reports");
      XLSX.writeFile(
        wb,
        `Financial_Reports_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      alert("📊 Financial reports exported to Excel successfully!");
    };

    if (reports.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <i className="fas fa-chart-line text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500">No financial reports generated yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click on "Financial Overview" card to generate your first report
          </p>
        </div>
      );
    }

    // Calculate summary statistics
    const totalRevenue = reports.reduce(
      (sum, r) => sum + parseInt(r.totalAmount || r.amount || 0),
      0,
    );
    const totalPaid = reports.filter((r) => r.paymentStatus === "paid").length;
    const totalPending = reports.filter(
      (r) => r.paymentStatus === "pending",
    ).length;
    const avgCollectionRate =
      reports.reduce((sum, r) => sum + (parseFloat(r.collectionRate) || 0), 0) /
      reports.length;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">
                Total Revenue
              </span>
              <i className="fas fa-rupee-sign text-green-600"></i>
            </div>
            <div className="text-2xl font-bold text-green-900">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-green-600 mt-1">
              From {reports.length} reports
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                Collection Rate
              </span>
              <i className="fas fa-chart-line text-blue-600"></i>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {avgCollectionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Average across reports
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">
                Paid Invoices
              </span>
              <i className="fas fa-check-circle text-purple-600"></i>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {totalPaid}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Successfully paid
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">
                Pending
              </span>
              <i className="fas fa-clock text-orange-600"></i>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {totalPending}
            </div>
            <div className="text-xs text-orange-600 mt-1">Awaiting payment</div>
          </div>
        </div>

        {/* Financial Reports Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Financial Reports Dashboard
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total Reports: {reports.length} | Total Revenue: ₹
                  {totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <i className="fas fa-file-excel mr-2"></i>
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collection Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {financialReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {report.invoiceId || report.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {report.hospitalName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.planType === "Enterprise"
                            ? "bg-purple-100 text-purple-700"
                            : report.planType === "Professional"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {report.planType}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {report.billingCycle}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        ₹
                        {parseInt(
                          report.totalAmount || report.amount || 0,
                        ).toLocaleString("en-IN")}
                      </div>
                      {report.newRevenue && (
                        <div className="text-xs text-green-600">
                          +₹
                          {parseInt(report.newRevenue).toLocaleString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          report.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : report.paymentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        <i
                          className={`fas ${
                            report.paymentStatus === "paid"
                              ? "fa-check-circle"
                              : report.paymentStatus === "pending"
                                ? "fa-clock"
                                : "fa-exclamation-circle"
                          } mr-1 text-xs`}
                        ></i>
                        {report.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {report.collectionRate
                          ? `${report.collectionRate}%`
                          : "—"}
                      </div>
                      {report.paidInvoices && (
                        <div className="text-xs text-gray-500">
                          {report.paidInvoices}/{report.totalInvoices} invoices
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {report.generatedDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadInvoice(report)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Invoice"
                        >
                          <i className="fas fa-file-invoice"></i>
                        </button>
                        <button
                          onClick={() => onDelete(report.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Add this component before the return statement, after the FinancialReportsTable component
  const PerformanceReportsTable = ({ reports = [], onDelete }) => {
    const downloadPerformanceReport = (report) => {
      const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Performance Report - ${report.hospitalName}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f0f2f5;
            padding: 40px;
          }
          .report-wrapper {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .report-header {
            padding: 30px;
            text-align: center;
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 20px;
            opacity: 0.9;
          }
          .report-body {
            padding: 30px;
          }
          .hospital-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-label {
            font-weight: 600;
            color: #4b5563;
          }
          .info-value {
            color: #1f2937;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #374151;
            margin: 25px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
          }
          .services-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 15px 0;
          }
          .service-badge {
            background: #e0e7ff;
            color: #4338ca;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .metric-card {
            background: #f9fafb;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
          }
          .metric-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 5px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-active { background: #d1fae5; color: #065f46; }
          .status-inactive { background: #fee2e2; color: #991b1b; }
          .status-suspended { background: #fed7aa; color: #92400e; }
          .issue-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
          }
          .upgrade-box {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 15px 0;
            border-radius: 8px;
          }
          .report-footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { background: white; padding: 0; }
            .report-wrapper { box-shadow: none; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="report-wrapper">
          <div class="report-header">
            <div class="company-name">Healthcare Platform</div>
            <div class="report-title">Performance Report</div>
          </div>
          
          <div class="report-body">
            <div class="hospital-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Hospital Name:</span>
                  <span class="info-value">${report.hospitalName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Report ID:</span>
                  <span class="info-value">${report.id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Generated Date:</span>
                  <span class="info-value">${report.generatedDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Service Status:</span>
                  <span class="info-value">
                    <span class="status-badge status-${report.serviceStatus}">
                      ${report.serviceStatus.toUpperCase()}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div class="section-title">Services Used</div>
            <div class="services-list">
              ${report.servicesUsed.map((service) => `<span class="service-badge">${service}</span>`).join("")}
            </div>
            
            <div class="info-grid" style="margin-bottom: 20px;">
              <div class="info-item">
                <span class="info-label">Service Period:</span>
                <span class="info-value">${report.serviceStartDate}  to  ${report.serviceEndDate || "Ongoing"}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Total Duration:</span>
                <span class="info-value">${report.totalDuration || "Ongoing"}</span>
              </div>
            </div>

            <div class="section-title">Performance Metrics</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${report.metrics?.systemUptime || "—"}%</div>
                <div class="metric-label">System Uptime</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${report.metrics?.avgResponseTime || "—"}ms</div>
                <div class="metric-label">Avg Response Time</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${report.metrics?.errorRate || "—"}%</div>
                <div class="metric-label">Error Rate</div>
              </div>
            </div>

            ${
              report.hasIssue
                ? `
              <div class="section-title">Issues & Resolution</div>
              <div class="issue-box">
                <div class="info-item"><strong>Issue Title:</strong> ${report.issueDetails?.title}</div>
                <div class="info-item"><strong>Reported Date:</strong> ${report.issueDetails?.reportedDate}</div>
                <div class="info-item"><strong>Status:</strong> ${report.issueDetails?.resolutionStatus}</div>
                <div class="info-item"><strong>Description:</strong> ${report.issueDetails?.description}</div>
              </div>
            `
                : ""
            }

            ${
              report.hasUpgrade
                ? `
              <div class="section-title">Service Upgrades</div>
              <div class="upgrade-box">
                <div class="info-item"><strong>Upgrade Type:</strong> ${report.upgradeDetails?.type}</div>
                <div class="info-item"><strong>Upgrade Date:</strong> ${report.upgradeDetails?.date}</div>
                <div class="info-item"><strong>Description:</strong> ${report.upgradeDetails?.description}</div>
              </div>
            `
                : ""
            }
          </div>
          
          <div class="report-footer">
            <p>Generated by Healthcare Platform Analytics System</p>
            <p style="margin-top: 10px;">Report Date: ${new Date().toLocaleString()}</p>
          </div>
        </div>

      </body>
      </html>
    `;

      const blob = new Blob([reportHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Performance_Report_${report.hospitalName.replace(/\s+/g, "_")}_${report.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(
        `Performance report for ${report.hospitalName} downloaded successfully!`,
      );
    };

    const exportToExcel = () => {
      const allData = performanceReports.map((r) => ({
        "Hospital Name": r.hospitalName,
        "Hospital ID": r.hospitalId,
        "Service Status": r.serviceStatus,
        "Services Used": r.servicesUsed.join(", "),
        "Service Start Date": r.serviceStartDate,
        "Service End Date": r.serviceEndDate || "Ongoing",
        "Total Duration": r.totalDuration || "Ongoing",
        "System Uptime": r.metrics?.systemUptime
          ? `${r.metrics.systemUptime}%`
          : "N/A",
        "Avg Response Time": r.metrics?.avgResponseTime
          ? `${r.metrics.avgResponseTime}ms`
          : "N/A",
        "Error Rate": r.metrics?.errorRate ? `${r.metrics.errorRate}%` : "N/A",
        "Has Issue": r.hasIssue ? "Yes" : "No",
        "Issue Title": r.issueDetails?.title || "N/A",
        "Issue Status": r.issueDetails?.resolutionStatus || "N/A",
        "Has Upgrade": r.hasUpgrade ? "Yes" : "No",
        "Upgrade Type": r.upgradeDetails?.type || "N/A",
        "Generated Date": r.generatedDate,
      }));

      const ws = XLSX.utils.json_to_sheet(allData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Performance Reports");
      XLSX.writeFile(
        wb,
        `Performance_Reports_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      alert("Performance reports exported to Excel successfully!");
    };

    if (reports.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <i className="fas fa-tachometer-alt text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500">No performance reports generated yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click on "Platform Performance" card to generate your first report
          </p>
        </div>
      );
    }

    // Calculate summary statistics
    const totalReports = reports.length;
    const activeServices = reports.filter(
      (r) => r.serviceStatus === "active",
    ).length;
    const issuesReported = reports.filter((r) => r.hasIssue).length;
    const upgradesProvided = reports.filter((r) => r.hasUpgrade).length;
    const avgUptime =
      reports.reduce(
        (sum, r) => sum + (parseFloat(r.metrics?.systemUptime) || 0),
        0,
      ) / reports.length;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">
                Total Reports
              </span>
              <i className="fas fa-chart-line text-purple-600"></i>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {totalReports}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              Performance reports
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">
                Active Services
              </span>
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {activeServices}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Out of {totalReports} hospitals
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700">
                Issues Reported
              </span>
              <i className="fas fa-exclamation-triangle text-red-600"></i>
            </div>
            <div className="text-2xl font-bold text-red-900">
              {issuesReported}
            </div>
            <div className="text-xs text-red-600 mt-1">Requiring attention</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                Avg Uptime
              </span>
              <i className="fas fa-chart-line text-blue-600"></i>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {avgUptime.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Platform reliability
            </div>
          </div>
        </div>

        {/* Performance Reports Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  Performance Reports Dashboard
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total Reports: {reports.length} | Active Services:{" "}
                  {activeServices} | Issues: {issuesReported}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportToExcel}
                  className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <i className="fas fa-file-excel mr-2"></i>
                  Export Excel
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upgrades
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {performanceReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {report.hospitalName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.hospitalId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {report.servicesUsed.slice(0, 2).map((service, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 rounded-full"
                          >
                            {service}
                          </span>
                        ))}
                        {report.servicesUsed.length > 2 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                            +{report.servicesUsed.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          report.serviceStatus === "active"
                            ? "bg-green-100 text-green-700"
                            : report.serviceStatus === "inactive"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        <i
                          className={`fas ${
                            report.serviceStatus === "active"
                              ? "fa-check-circle"
                              : report.serviceStatus === "inactive"
                                ? "fa-times-circle"
                                : "fa-exclamation-circle"
                          } mr-1 text-xs`}
                        ></i>
                        {report.serviceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">
                        {report.metrics?.systemUptime || "—"}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {report.metrics?.avgResponseTime || "—"}ms
                    </td>
                    <td className="px-4 py-3">
                      {report.hasIssue ? (
                        <span className="text-red-600">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          Yes
                        </span>
                      ) : (
                        <span className="text-green-600">
                          <i className="fas fa-check-circle mr-1"></i>
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {report.hasUpgrade ? (
                        <span className="text-purple-600">
                          <i className="fas fa-arrow-up mr-1"></i>
                          {report.upgradeDetails?.type || "Yes"}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {report.generatedDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadPerformanceReport(report)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Report"
                        >
                          <i className="fas fa-file-alt"></i>
                        </button>
                        <button
                          onClick={() => onDelete(report.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to reset form
const resetNewReportForm = () => {
  setNewReport({
    title: "",
    type: "subscription",

    // Subscription
    hospitalName: "",
    planType: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    status: "",
    billingCycle: "",
    amountPaid: "",
    renewalDate: "",
    autoRenewal: false,

    // Financial
    collectionRate: "",
    newRevenue: "",
    churnRevenue: "",
    upgradeRevenue: "",
    downgradeRevenue: "",
    arpu: "",
    ltv: "",
    totalInvoices: "",
    paidInvoices: "",
    pendingInvoices: "",
    failedPayments: "",
    invoiceId: "",
    invoiceDate: "",
    dueDate: "",
    paymentDate: "",
    amount: "",
    tax: "",
    discount: "",
    totalAmount: "",
    paymentStatus: "",
    paymentMethod: "",
    transactionId: "",
    gst: "",
    cgst: "",
    sgst: "",
    igst: "",

    // Performance
    hospitalId: "",
    servicesUsed: [],
    serviceStartDate: "",
    serviceEndDate: "",
    totalDuration: "",
    serviceStatus: "",
    hasIssue: false,
    issueTitle: "",
    issueReportedDate: "",
    issueDescription: "",
    resolutionStatus: "",
    hasUpgrade: false,
    upgradeType: "",
    upgradeDate: "",
    upgradeDescription: "",
    systemUptime: "",
    avgResponseTime: "",
    errorRate: ""
  });
};

  const getDefaultChartsForType = (type) => {
    const chartMap = {
      subscription: [
        "Subscription Growth",
        "Plan Distribution",
        "Churn Analysis",
      ],
      financial: ["Revenue Trends", "MRR/ARR Analysis", "Collection Rates"],
      performance: ["Platform Uptime", "API Performance", "User Activity"],
      usage: ["Active Users", "API Requests", "Storage Usage"],
      custom: ["Custom Analytics", "Performance Metrics"],
    };
    return chartMap[type] || ["Platform Overview"];
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle servicesUsed array (checkbox group)
    if (name === "servicesUsed") {
      const current = newReport.servicesUsed || [];
      const updated = checked
        ? [...current, value]
        : current.filter((s) => s !== value);

      setNewReport((prev) => ({
        ...prev,
        servicesUsed: updated,
      }));
      return;
    }

    // Handle hasIssue and hasUpgrade checkboxes
    if (name === "hasIssue" || name === "hasUpgrade") {
      setNewReport((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    // Handle all other inputs (text, number, select, date, checkbox)
    setNewReport((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setDateRange({ startDate: start, endDate: end });
  };

  // View Report Functions
  const viewReport = (report) => {
    setSelectedReport(report);
    setIsViewReportModalOpen(true);
  };

  const closeViewReportModal = () => {
    setIsViewReportModalOpen(false);
    setSelectedReport(null);
  };

  // Download Functions
  const downloadReport = (report) => {
    if (report.status !== "completed") {
      alert("⏳ Report is still processing. Please wait until it completes.");
      return;
    }

    // Update download count
    setReports((prev) =>
      prev.map((r) =>
        r.id === report.id
          ? {
              ...r,
              downloadCount: r.downloadCount + 1,
              lastAccessed: new Date().toISOString().split("T")[0],
            }
          : r,
      ),
    );

    // Create downloadable content based on format
    if (report.format === "Excel") {
      exportToExcel(report);
    } else {
      alert(`📥 Downloading "${report.title}" (${report.format})...`);
      // Simulate download
      setTimeout(() => {
        alert(
          `✅ Super Admin Report "${report.title}" has been downloaded successfully.`,
        );
      }, 1000);
    }
  };

  const exportToExcel = (report) => {
    const data = analyticsData.revenueTrends.map((item) => ({
      Month: item.month,
      "Monthly Recurring Revenue": `$${item.mrr.toLocaleString()}`,
      "Annual Recurring Revenue": `$${item.arr.toLocaleString()}`,
      "New Revenue": `$${item.newRevenue.toLocaleString()}`,
      "Churn Revenue": `$${item.churnRevenue.toLocaleString()}`,
      "Net Revenue Growth": `$${item.netRevenue.toLocaleString()}`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Platform Revenue");
    XLSX.writeFile(
      workbook,
      `${report.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const deleteReport = (reportId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this report? This action cannot be undone.",
      )
    ) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      alert("🗑️ Report deleted successfully");
    }
  };

  // Schedule Report Function
  const scheduleReport = (report) => {
    const frequency = prompt(
      "Enter schedule frequency (daily, weekly, monthly, quarterly):",
      "weekly",
    );
    if (frequency) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, scheduled: true, frequency } : r,
        ),
      );
      alert(` Report "${report.title}" scheduled for ${frequency} generation.`);
    }
  };

  // Enhanced Quick Actions for Super Admin
  const quickActions = [
    {
      title: "Subscription Analytics",
      icon: "fa-chart-line",
      description: "Monitor hospital subscriptions and growth",
      action: () => {
        setActiveCard("subscription");
        setIsSubscriptionModalOpen(true); //  open table modal
      },
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Financial Overview",
      icon: "fa-chart-pie",
      description: "Track revenue, MRR, and financial metrics",
      action: () => {
        setActiveCard("financial");
        setIsFinancialModalOpen(true); // Open financial modal
      },
      color: "from-green-500 to-green-600",
    },
  ];

  // Enhanced Status Badge Component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      completed: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <i className="fas fa-check mr-1.5"></i>,
        text: "Completed",
      },
      processing: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <i className="fas fa-sync-alt mr-1.5 animate-spin"></i>,
        text: "Processing",
      },
      failed: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <i className="fas fa-times mr-1.5"></i>,
        text: "Failed",
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <i className="fas fa-question-circle mr-1.5"></i>,
      text: "Unknown",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${config.color}`}
      >
        {config.icon}
        {config.text}
      </span>
    );
  };

  // Enhanced Format Badge Component
  const FormatBadge = ({ format }) => {
    const formatConfig = {
      PDF: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: "fas fa-file-pdf",
      },
      Excel: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "fas fa-file-excel",
      },
      CSV: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: "fas fa-file-csv",
      },
    };

    const config = formatConfig[format] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "fas fa-file",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}
      >
        <i className={`${config.icon} mr-1.5`}></i>
        {format}
      </span>
    );
  };

  // Enhanced Metric Card Component for Super Admin
  const MetricCard = ({ title, value, change, icon, color, subtitle }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className={`p-2 md:p-3 rounded-lg ${color} bg-opacity-10`}>
          <i
            className={`${icon} ${color.replace("bg-", "text-")} text-lg md:text-xl`}
          ></i>
        </div>
        <span
          className={`text-xs font-semibold px-2 md:px-3 py-1 rounded-full ${
            change >= 0
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
        </span>
      </div>
      <div className="space-y-1">
        <div className="text-xl md:text-2xl font-bold text-gray-900">
          {value}
        </div>
        <div className="text-sm font-medium text-gray-700">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );

  // Plan Type Badge Component
  const PlanTypeBadge = ({ planType }) => {
    const planColors = {
      all: "bg-gray-100 text-gray-800 border-gray-200",
      basic: "bg-blue-100 text-blue-800 border-blue-200",
      professional: "bg-green-100 text-green-800 border-green-200",
      enterprise: "bg-purple-100 text-purple-800 border-purple-200",
      custom: "bg-amber-100 text-amber-800 border-amber-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-medium border ${planColors[planType] || "bg-gray-50 text-gray-700 border-gray-200"}`}
      >
        {planType.charAt(0).toUpperCase() + planType.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Reports & Analytics{" "}
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Monitor platform performance, subscription metrics, and financial
              analytics
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            <button
              onClick={openGenerateReportModal}
              className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow text-sm md:text-base"
            >
              <i className="fas fa-plus mr-2"></i>Generate
            </button>
          </div>
        </div>
      </div>
      {/* Date Range Filter - MOBILE OPTIMIZED */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto">
            <h3 className="font-semibold text-gray-900 text-lg">
              Date Range Filter
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Select date range for platform analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-auto">
              <DatePicker
                selected={dateRange.startDate}
                onChange={handleDateChange}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                selectsRange
                className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm md:text-base"
                placeholderText="Select date range"
              />
            </div>
            <button
              onClick={() =>
                setDateRange({
                  startDate: new Date(
                    new Date().setMonth(new Date().getMonth() - 3),
                  ),
                  endDate: new Date(),
                })
              }
              className="px-4 py-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-colors font-medium text-sm md:text-base whitespace-nowrap"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Reports Table - Conditionally Rendered */}
      <Modal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        title="Subscription Analytics"
        size="xl"
      >
        <SubscriptionReportsTable
          reports={subscriptionReports}
          onDelete={(reportId) => {
            if (window.confirm("Delete this report?")) {
              setSubscriptionReports((prev) =>
                prev.filter((r) => r.id !== reportId),
              );
              alert("Report deleted");

              if (subscriptionReports.length === 1) {
                setIsSubscriptionModalOpen(false);
              }
            }
          }}
        />
      </Modal>
      <Modal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        title="Financial Overview Dashboard"
        size="xl"
      >
        <FinancialReportsTable
          reports={financialReports}
          onDelete={(reportId) => {
            if (
              window.confirm(
                "Are you sure you want to delete this financial report?",
              )
            ) {
              setFinancialReports((prev) =>
                prev.filter((r) => r.id !== reportId),
              );
              alert("🗑️ Financial report deleted successfully");

              if (financialReports.length === 1) {
                setIsFinancialModalOpen(false);
              }
            }
          }}
        />
      </Modal>
      {/* Report List Table (Add your table component here) */}
      {/* Generate Report Modal - MOBILE OPTIMIZED */}
      <Modal
        isOpen={isGenerateReportModalOpen}
        onClose={closeGenerateReportModal}
        title="Generate Super Admin Report"
        size="lg"
      >
        <form onSubmit={handleGenerateReport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title{" "}
                <span className="text-red-400 font-semibold text-base align-middle">
                  *
                </span>
              </label>
              <input
                type="text"
                name="title"
                value={newReport.title}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                placeholder="e.g., Monthly Subscription Analytics Report"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type{" "}
                <span className="text-red-400 font-semibold text-base align-middle">
                  *
                </span>
              </label>
              <select
                name="type"
                value={newReport.type}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                required
              >
                <option value="subscription">
                  Subscription Analytics Report
                </option>
                <option value="financial">Financial Performance Report</option>
                <option value="performance">Platform Performance Report</option>
              </select>
            </div>

            {/* Dynamic Fields based on Report Type */}
            {newReport.type === "subscription" && (
              <div className="col-span-1 md:col-span-2 space-y-4">
                <h4 className="font-semibold text-gray-900 text-base md:text-lg border-b pb-2">
                  Core Subscription Data
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital Name
                    </label>

                    <select
                      name="hospitalName"
                      value={newReport.hospitalName || "select"}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      required
                    >
                      <option value="select">Select Hospital</option>
                      {hospitalList.map((h, i) => (
                        <option key={i} value={h.name || h.hospital_name}>{h.name || h.hospital_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Type
                    </label>
                    <select
                      name="planType"
                      value={newReport.planType || "select"}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    >
                      <option value="select">Select plan type</option>
                      {planList.map((p, i) => (
                        <option key={i} value={p.name || p.plan_name}>{p.name || p.plan_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="subscriptionStartDate"
                      value={newReport.subscriptionStartDate || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="subscriptionEndDate"
                      value={newReport.subscriptionEndDate || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={newReport.status || "select"}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    >
                      <option value="select">Select status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Cycle
                    </label>
                    <select
                      name="billingCycle"
                      value={newReport.billingCycle || "select"}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    >
                      <option value="select">Select billing cycle</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half_yearly">Half Yearly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="amountPaid"
                      value={newReport.amountPaid || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Renewal Date
                    </label>
                    <input
                      type="date"
                      name="renewalDate"
                      value={newReport.renewalDate || ""}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        name="autoRenewal"
                        checked={newReport.autoRenewal || false}
                        onChange={handleInputChange}
                        className="h-4 w-4 md:h-5 md:w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700 font-medium text-sm md:text-base">
                        Auto Renewal
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {newReport.type === "financial" && (
              <div className="col-span-1 md:col-span-2 space-y-6">
                {/* Hospital & Plan Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-base md:text-lg border-b pb-2 flex items-center gap-2">
                    Hospital & Plan Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hospital Name <span className="text-red-500">*</span>
                      </label>

                      <select
                        name="hospitalName"
                        value={newReport.hospitalName || "select"}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        required
                      >
                        <option value="select">Select Hospital</option>
                        {hospitalList.map((h, i) => (
                          <option key={i} value={h.name || h.hospital_name}>{h.name || h.hospital_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan Type
                      </label>
                      <select
                        name="planType"
                        value={newReport.planType || "select"}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      >
                        <option value="select">Select plan type</option>
                        {planList.map((p, i) => (
                          <option key={i} value={p.name || p.plan_name}>{p.name || p.plan_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Cycle
                      </label>
                      <select
                        name="billingCycle"
                        value={newReport.billingCycle || "select"}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      >
                        <option value="select">Select billing cycle</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="half_yearly">Half Yearly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collection Rate (%)
                      </label>
                      <input
                        type="number"
                        name="collectionRate"
                        value={newReport.collectionRate || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 92.5"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Revenue Insights */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-base md:text-lg border-b pb-2 flex items-center gap-2">
                    Subscription Revenue Insights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Revenue (₹)
                      </label>
                      <input
                        type="number"
                        name="newRevenue"
                        value={newReport.newRevenue || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 75000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Churn Revenue (₹)
                      </label>
                      <input
                        type="number"
                        name="churnRevenue"
                        value={newReport.churnRevenue || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 25000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upgrade Revenue (₹)
                      </label>
                      <input
                        type="number"
                        name="upgradeRevenue"
                        value={newReport.upgradeRevenue || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 15000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Downgrade Revenue (₹)
                      </label>
                      <input
                        type="number"
                        name="downgradeRevenue"
                        value={newReport.downgradeRevenue || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 5000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ARPU - Avg Revenue Per User (₹)
                      </label>
                      <input
                        type="number"
                        name="arpu"
                        value={newReport.arpu || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 16333"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LTV - Lifetime Value (₹)
                      </label>
                      <input
                        type="number"
                        name="ltv"
                        value={newReport.ltv || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 196000"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice & Billing Summary */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-base md:text-lg border-b pb-2 flex items-center gap-2">
                    Invoice & Billing Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Invoices
                      </label>
                      <input
                        type="number"
                        name="totalInvoices"
                        value={newReport.totalInvoices || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 245"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paid Invoices
                      </label>
                      <input
                        type="number"
                        name="paidInvoices"
                        value={newReport.paidInvoices || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 227"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pending Invoices
                      </label>
                      <input
                        type="number"
                        name="pendingInvoices"
                        value={newReport.pendingInvoices || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 18"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Failed Payments
                      </label>
                      <input
                        type="number"
                        name="failedPayments"
                        value={newReport.failedPayments || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-base md:text-lg border-b pb-2 flex items-center gap-2">
                    Invoice Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice ID
                      </label>
                      <input
                        type="text"
                        name="invoiceId"
                        value={newReport.invoiceId || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., INV-10234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        name="invoiceDate"
                        value={newReport.invoiceDate || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={newReport.dueDate || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Date
                      </label>
                      <input
                        type="date"
                        name="paymentDate"
                        value={newReport.paymentDate || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-base md:text-lg border-b pb-2 flex items-center gap-2">
                    Payment Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={newReport.amount || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax (₹)
                      </label>
                      <input
                        type="number"
                        name="tax"
                        value={newReport.tax || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 9000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        name="discount"
                        value={newReport.discount || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 5000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="totalAmount"
                        value={newReport.totalAmount || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 59000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Status
                      </label>
                      <select
                        name="paymentStatus"
                        value={newReport.paymentStatus || "select"}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      >
                        <option value="select">Select</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <select
                        name="paymentMethod"
                        value={newReport.paymentMethod || "select"}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                      >
                        <option value="select">Select payment method</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="NetBanking">Net Banking</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction ID
                      </label>
                      <input
                        type="text"
                        name="transactionId"
                        value={newReport.transactionId || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., TXN123456"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Details (India Ready) */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 text-base md:text-lg border-b pb-2 flex items-center gap-2">
                    Tax Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST
                      </label>
                      <input
                        type="number"
                        name="gst"
                        value={newReport.gst || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 9000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CGST
                      </label>
                      <input
                        type="number"
                        name="cgst"
                        value={newReport.cgst || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 4500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SGST
                      </label>
                      <input
                        type="number"
                        name="sgst"
                        value={newReport.sgst || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 4500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IGST
                      </label>
                      <input
                        type="number"
                        name="igst"
                        value={newReport.igst || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                        placeholder="e.g., 9000"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-info-circle text-blue-600 text-lg mt-1"></i>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Financial Report Summary
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        This report will include complete financial analysis
                        including Revenue Overview, Subscription Insights,
                        Invoice Details, Payment Tracking, and GST breakdown.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {newReport.type === "performance" && (
              <div className="col-span-1 md:col-span-2 space-y-6">
                {/* Hospital Information Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Hospital Information
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hospital Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="hospitalId"
                        value={newReport.hospitalId || ""}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Hospital</option>
                        {hospitalList.map((h, i) => (
                          <option key={i} value={h._id || h.id}>
                            {h.name || h.hospital_name} ({h._id || h.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hospital ID
                      </label>
                      <input
                        type="text"
                        name="hospitalIdDisplay"
                        value={
                          newReport.hospitalId
                            ? newReport.hospitalId
                            : "Auto-filled"
                        }
                        readOnly
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Services Usage Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Services Usage
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Services Used by Hospital{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          "OPD",
                          "IPD",
                          "Pharmacy",
                          "Billing",
                          "Lab",
                          "Telemedicine",
                          "Radiology",
                          "Ambulance",
                          ...customServices,
                          "Other",
                        ].map((service) => (
                          <label
                            key={service}
                            className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-white cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              name="servicesUsed"
                              value={service}
                              checked={(newReport.servicesUsed || []).includes(
                                service,
                              )}
                              onChange={(e) => {
                                const current = newReport.servicesUsed || [];

                                const updated = e.target.checked
                                  ? [...current, service]
                                  : current.filter((s) => s !== service);

                                setNewReport((prev) => ({
                                  ...prev,
                                  servicesUsed: updated,
                                }));
                              }}
                              className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {service}
                            </span>
                          </label>
                        ))}
                        {(newReport.servicesUsed || []).includes("Other") && (
                          <div className="mt-3 flex gap-2">
                            <input
                              type="text"
                              value={customServiceInput}
                              onChange={(e) =>
                                setCustomServiceInput(e.target.value)
                              }
                              placeholder="Enter custom service"
                              className="flex-1 p-2 border border-gray-300 rounded-lg"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                if (!customServiceInput.trim()) return;

                                // Add to custom services list
                                setCustomServices((prev) => [
                                  ...prev,
                                  customServiceInput,
                                ]);

                                // Add to selected services
                                setNewReport((prev) => ({
                                  ...prev,
                                  servicesUsed: [
                                    ...(prev.servicesUsed || []),
                                    customServiceInput,
                                  ],
                                }));

                                // Clear input
                                setCustomServiceInput("");
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Start Date{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="serviceStartDate"
                          value={newReport.serviceStartDate || ""}
                          onChange={(e) => {
                            handleInputChange(e);
                            // Auto-calculate duration when both dates are set
                            if (newReport.serviceEndDate) {
                              const start = new Date(e.target.value);
                              const end = new Date(newReport.serviceEndDate);
                              const days = Math.ceil(
                                (end - start) / (1000 * 60 * 60 * 24),
                              );
                              setNewReport((prev) => ({
                                ...prev,
                                totalDuration: days > 0 ? `${days} days` : "",
                              }));
                            }
                          }}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service End Date
                        </label>
                        <input
                          type="date"
                          name="serviceEndDate"
                          value={newReport.serviceEndDate || ""}
                          onChange={(e) => {
                            handleInputChange(e);
                            if (newReport.serviceStartDate) {
                              const start = new Date(
                                newReport.serviceStartDate,
                              );
                              const end = new Date(e.target.value);
                              const days = Math.ceil(
                                (end - start) / (1000 * 60 * 60 * 24),
                              );
                              setNewReport((prev) => ({
                                ...prev,
                                totalDuration:
                                  days > 0 ? `${days} days` : "Ongoing",
                              }));
                            }
                          }}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Duration
                        </label>
                        <input
                          type="text"
                          name="totalDuration"
                          value={
                            newReport.totalDuration ||
                            (newReport.serviceEndDate
                              ? "Calculating..."
                              : "Ongoing")
                          }
                          readOnly
                          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="serviceStatus"
                        value={newReport.serviceStatus || "select"}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="select">Select status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Issues & Resolution Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Issues & Resolution Tracking
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasIssue"
                          checked={newReport.hasIssue || false}
                          onChange={(e) =>
                            setNewReport((prev) => ({
                              ...prev,
                              hasIssue: e.target.checked,
                            }))
                          }
                          className="h-5 w-5 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="text-gray-700 font-medium">
                          Is There Any Issue ?
                        </span>
                      </label>
                    </div>

                    {newReport.hasIssue && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Issue Title{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="issueTitle"
                              value={newReport.issueTitle || ""}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                              placeholder="e.g., API Integration Failure"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Issue Reported Date{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="issueReportedDate"
                              value={newReport.issueReportedDate || ""}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Issue Description{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            name="issueDescription"
                            value={newReport.issueDescription || ""}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                            placeholder="Detailed description of the issue..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Resolution Status
                            </label>
                            <select
                              name="resolutionStatus"
                              value={newReport.resolutionStatus || "select"}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                            >
                              <option value="select">
                                Select resolution status
                              </option>
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Service Upgrades Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Service Upgrades
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          name="hasUpgrade"
                          checked={newReport.hasUpgrade || false}
                          onChange={(e) =>
                            setNewReport((prev) => ({
                              ...prev,
                              hasUpgrade: e.target.checked,
                            }))
                          }
                          className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-gray-700 font-medium">
                          Any Upgrades Provided ?
                        </span>
                      </label>
                    </div>

                    {newReport.hasUpgrade && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upgrade Type{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <select
                              name="upgradeType"
                              value={newReport.upgradeType || ""}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="">Select Upgrade Type</option>
                              <option value="feature">Feature Upgrade</option>
                              <option value="plan">Plan Upgrade</option>
                              <option value="performance">
                                Performance Upgrade
                              </option>
                              <option value="security">Security Upgrade</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upgrade Date{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              name="upgradeDate"
                              value={newReport.upgradeDate || ""}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upgrade Description
                          </label>
                          <textarea
                            name="upgradeDescription"
                            value={newReport.upgradeDescription || ""}
                            onChange={handleInputChange}
                            rows="2"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                            placeholder="Describe the upgrade details..."
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Performance Metrics Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      Performance Metrics
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        System Uptime (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="systemUptime"
                          value={newReport.systemUptime || ""}
                          onChange={handleInputChange}
                          step="0.1"
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                          placeholder="99.9"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Average Response Time (ms)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="avgResponseTime"
                          value={newReport.avgResponseTime || ""}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                          placeholder="185"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">
                          ms
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Error Rate (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="errorRate"
                          value={newReport.errorRate || ""}
                          onChange={handleInputChange}
                          step="0.01"
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                          placeholder="0.5"
                        />
                        <span className="absolute right-3 top-3 text-gray-500">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Helper Text */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-info-circle text-blue-600 text-lg mt-1"></i>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">
                        Performance Report Summary
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        This report will capture comprehensive hospital service
                        performance, issue tracking, resolution metrics, and
                        upgrade history. All fields marked with{" "}
                        <span className="text-red-500">*</span> are required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <select
                name="timeframe"
                value={newReport.timeframe}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="last_quarter">Last Quarter</option>
              </select>
            </div>
          </div>

          {/* Report Options */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 text-base md:text-lg">
              Report Options
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="includeCharts"
                  checked={newReport.includeCharts}
                  onChange={handleInputChange}
                  className="h-4 w-4 md:h-5 md:w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700 font-medium text-sm md:text-base">
                  Include Charts & Graphs
                </span>
              </label>

              <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="emailNotification"
                  checked={newReport.emailNotification}
                  onChange={handleInputChange}
                  className="h-4 w-4 md:h-5 md:w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700 font-medium text-sm md:text-base">
                  Email Notification
                </span>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="schedule"
                  checked={newReport.schedule}
                  onChange={handleInputChange}
                  className="h-4 w-4 md:h-5 md:w-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-700 font-medium text-sm md:text-base">
                  Schedule Report
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={closeGenerateReportModal}
              className="px-4 md:px-6 py-2.5 md:py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow text-sm md:text-base"
            >
              <i className="fas fa-play mr-2"></i>
              Generate Report
            </button>
          </div>
        </form>
      </Modal>
      {/* Platform Performance Reports (Inline) */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Platform Performance Reports</h3>
        <PerformanceReportsTable
          reports={performanceReports}
          onDelete={(reportId) => {
            if (
              window.confirm(
                "Are you sure you want to delete this performance report?",
              )
            ) {
              setPerformanceReports((prev) =>
                prev.filter((r) => r.id !== reportId),
              );
              alert("🗑️ Performance report deleted successfully");
            }
          }}
        />
      </div>
      {/* View Report Modal - MOBILE OPTIMIZED */}
      <Modal
        isOpen={isViewReportModalOpen}
        onClose={closeViewReportModal}
        title={selectedReport?.title || "Super Admin Report Details"}
        size="xl"
      >
        {selectedReport && (
          <div className="space-y-4 md:space-y-6">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 md:p-6 border border-blue-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="col-span-2 md:col-span-1">
                  <div className="text-xs md:text-sm font-medium text-blue-600 mb-1">
                    Report ID
                  </div>
                  <div className="font-mono font-bold text-gray-900 text-sm md:text-lg truncate">
                    {selectedReport.id}
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <div className="text-xs md:text-sm font-medium text-blue-600 mb-1">
                    Report Type
                  </div>
                  <div className="font-semibold text-gray-900 capitalize text-sm md:text-base">
                    {selectedReport.type}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="text-xs md:text-sm font-medium text-blue-600 mb-1">
                    Plan Type
                  </div>
                  <div className="flex items-center">
                    <PlanTypeBadge planType={selectedReport.planType} />
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="text-xs md:text-sm font-medium text-blue-600 mb-1">
                    Status
                  </div>
                  <div className="flex items-center">
                    <StatusBadge status={selectedReport.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h4 className="font-semibold text-gray-900 text-base md:text-lg">
                  Super Admin Report Preview
                </h4>
                <div className="text-xs md:text-sm text-gray-500">
                  Generated: {selectedReport.generatedDate}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-3">
                  <div className="flex-1">
                    <h5 className="text-lg md:text-xl font-bold text-gray-900">
                      {selectedReport.title}
                    </h5>
                    <p className="text-gray-600 mt-1 text-sm md:text-base">
                      {selectedReport.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs md:text-sm text-gray-500">
                      Timeframe:
                    </div>
                    <div className="font-semibold text-sm md:text-base">
                      Last 30 days
                    </div>
                  </div>
                </div>

                {/* Report Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
                  <div className="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-200">
                    <div className="text-xs md:text-sm font-medium text-blue-600 mb-1 md:mb-2">
                      Report Size
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">
                      {selectedReport.size}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 md:p-4 rounded-xl border border-green-200">
                    <div className="text-xs md:text-sm font-medium text-green-600 mb-1 md:mb-2">
                      Records
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">
                      {selectedReport.records.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 md:p-4 rounded-xl border border-purple-200">
                    <div className="text-xs md:text-sm font-medium text-purple-600 mb-1 md:mb-2">
                      Downloads
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">
                      {selectedReport.downloadCount}
                    </div>
                  </div>
                </div>

                {/* Charts Preview */}
                {selectedReport.chartsIncluded &&
                  selectedReport.chartsIncluded.length > 0 && (
                    <div className="mb-6 md:mb-8">
                      <h6 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                        Included Charts:
                      </h6>
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {selectedReport.chartsIncluded.map((chart, idx) => (
                          <span
                            key={idx}
                            className="px-2 md:px-3 py-1 bg-blue-50 text-blue-700 text-xs md:text-sm font-medium rounded-lg border border-blue-200"
                          >
                            {chart}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Sample Super Admin Data Table */}
                <div className="mb-6 md:mb-8">
                  <h6 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                    Sample Platform Metrics
                  </h6>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs md:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 md:px-4 md:py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                            Metric
                          </th>
                          <th className="px-3 py-2 md:px-4 md:py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                            Current
                          </th>
                          <th className="px-3 py-2 md:px-4 md:py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                            Previous
                          </th>
                          <th className="px-3 py-2 md:px-4 md:py-3 text-left font-medium text-gray-700 whitespace-nowrap">
                            Change
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-gray-900 whitespace-nowrap">
                            Active Subscriptions
                          </td>
                          <td className="px-3 py-2 md:px-4 md:py-3">150</td>
                          <td className="px-3 py-2 md:px-4 md:py-3">142</td>
                          <td className="px-3 py-2 md:px-4 md:py-3">
                            <span className="text-green-600 font-medium">
                              +5.6%
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-gray-900 whitespace-nowrap">
                            Monthly Recurring Revenue
                          </td>
                          <td className="px-3 py-2 md:px-4 md:py-3">
                            $204,167
                          </td>
                          <td className="px-3 py-2 md:px-4 md:py-3">
                            $185,000
                          </td>
                          <td className="px-3 py-2 md:px-4 md:py-3">
                            <span className="text-green-600 font-medium">
                              +10.4%
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 md:px-4 md:py-3 font-medium text-gray-900 whitespace-nowrap">
                            Platform Uptime
                          </td>
                          <td className="px-3 py-2 md:px-4 md:py-3">99.9%</td>
                          <td className="px-3 py-2 md:px-4 md:py-3">99.7%</td>
                          <td className="px-3 py-2 md:px-4 md:py-3">
                            <span className="text-green-600 font-medium">
                              +0.2%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Status Message */}
                {selectedReport.status === "processing" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
                    <div className="flex items-center">
                      <i className="fas fa-spinner fa-spin text-blue-500 text-lg md:text-xl mr-3 md:mr-4"></i>
                      <div>
                        <p className="font-semibold text-blue-700 text-sm md:text-base">
                          Super Admin Report is being generated
                        </p>
                        <p className="text-blue-600 text-xs md:text-sm mt-1">
                          Collecting platform data and generating insights...
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 md:mt-4">
                      <div className="h-1.5 md:h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full animate-pulse"
                          style={{ width: "75%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport.status === "completed" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center">
                        <i className="fas fa-check-circle text-green-500 text-lg md:text-xl mr-3 md:mr-4"></i>
                        <div>
                          <p className="font-semibold text-green-700 text-sm md:text-base">
                            Super Admin Report generated successfully
                          </p>
                          <p className="text-green-600 text-xs md:text-sm mt-1">
                            Ready for strategic analysis and decision making
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          downloadReport(selectedReport);
                          closeViewReportModal();
                        }}
                        className="px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-sm hover:shadow text-sm md:text-base mt-3 md:mt-0"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Download
                      </button>
                    </div>
                  </div>
                )}

                {selectedReport.status === "failed" && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center">
                        <i className="fas fa-exclamation-circle text-red-500 text-lg md:text-xl mr-3 md:mr-4"></i>
                        <div>
                          <p className="font-semibold text-red-700 text-sm md:text-base">
                            Report generation failed
                          </p>
                          <p className="text-red-600 text-xs md:text-sm mt-1">
                            Please try again or contact platform support
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setReports((prev) =>
                            prev.map((r) =>
                              r.id === selectedReport.id
                                ? { ...r, status: "processing" }
                                : r,
                            ),
                          );
                          setTimeout(() => {
                            setReports((prev) =>
                              prev.map((r) =>
                                r.id === selectedReport.id
                                  ? {
                                      ...r,
                                      status: "completed",
                                      size: "2.8 MB",
                                      records: 1850,
                                    }
                                  : r,
                              ),
                            );
                          }, 2000);
                        }}
                        className="px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-sm hover:shadow text-sm md:text-base mt-3 md:mt-0"
                      >
                        <i className="fas fa-redo mr-2"></i>
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 md:pt-6 border-t">
              <button
                onClick={closeViewReportModal}
                className="px-4 md:px-6 py-2.5 md:py-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium text-sm md:text-base"
              >  Close
              </button>
              <button
                onClick={() => {
                  downloadReport(selectedReport);
                  closeViewReportModal();
                }}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                disabled={selectedReport.status !== "completed"}
              >
                <i className="fas fa-download mr-2"></i>  Download Report
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportsAnalytics;