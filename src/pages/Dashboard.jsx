import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseClient } from '../config/supabase';
import PaymentMethodIcon from '../components/PaymentMethodIcon';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    pendingPayments: 0,
    pendingMonths: [],
    totalDue: 0,
    feeCurrency: null,
    feeAmount: null,
    isWaived: false,
  });
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BDT');
  const [selectedMethod, setSelectedMethod] = useState('');
  const hasLoadedRef = useRef(false);

  const paymentMethods = {
    USD: ['Zelle', 'PayPal', 'Venmo', 'Cash', 'Bank Transfer', 'Other'],
    BDT: ['bKash', 'Nagad', 'Rocket', 'Cash', 'Bank Transfer', 'Other'],
  };

  // Format email to replace @mail.itcpr.org with @itcpr
  const formatEmail = (email) => {
    if (!email) return '';
    return email.replace('@mail.itcpr.org', '@itcpr');
  };

  // Get payment method details from environment variables
  const getPaymentInstructions = () => {
    const userEmail = formatEmail(userData?.email || user?.email);
    
    return {
      USD: {
        Zelle: {
          title: 'Zelle Payment',
          instructions: [
            `Send payment to: ${import.meta.env.VITE_ZELLE_EMAIL_OR_PHONE || '[Your Zelle Email/Phone]'}`,
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact: tmalakar@mail.itcpr.org',
          ],
        },
        PayPal: {
          title: 'PayPal Payment',
          instructions: [
            `Send payment to: ${import.meta.env.VITE_PAYPAL_EMAIL || '[Your PayPal Email]'}`,
            'Select "Friends and Family" to avoid fees',
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact: tmalakar@mail.itcpr.org',
          ],
        },
        Venmo: {
          title: 'Venmo Payment',
          instructions: [
            `Send payment to: ${import.meta.env.VITE_VENMO_USERNAME || '[Your Venmo Username]'}`,
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact: tmalakar@mail.itcpr.org',
          ],
        },
        'Bank Transfer': {
          title: 'Bank Transfer (USD)',
          instructions: [
            `Account Name: ${import.meta.env.VITE_BANK_ACCOUNT_NAME_USD || '[Account Name]'}`,
            `Account Number: ${import.meta.env.VITE_BANK_ACCOUNT_NUMBER_USD || '[Account Number]'}`,
            `Routing Number: ${import.meta.env.VITE_BANK_ROUTING_NUMBER_USD || '[Routing Number]'}`,
            `Bank Name: ${import.meta.env.VITE_BANK_NAME_USD || '[Bank Name]'}`,
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact: tmalakar@mail.itcpr.org',
          ],
        },
        Cash: {
          title: 'Cash Payment',
          instructions: [
            'Cash payments can be made in person',
            'Please contact us at tmalakar@mail.itcpr.org to arrange a meeting',
            'Always request a receipt for cash payments',
          ],
        },
        Other: {
          title: 'Other Payment Method',
          instructions: [
            'Please contact us at tmalakar@mail.itcpr.org for alternative payment arrangements',
            'We accept various payment methods based on your location',

          ],
        },
      },
      BDT: {
        bKash: {
          title: 'bKash Payment',
          instructions: [
            `Send payment to: ${import.meta.env.VITE_BKASH_NUMBER || '[Your bKash Number]'}`,
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact us at majasem@mail.itcpr.org',
          ],
        },
        Nagad: {
          title: 'Nagad Payment',
          instructions: [
            `Send payment to: ${import.meta.env.VITE_NAGAD_NUMBER || '[Your Nagad Number]'}`,
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact us at majasem@mail.itcpr.org',
          ],
        },
        Rocket: {
          title: 'Rocket Payment',
          instructions: [
            `Send payment to: ${import.meta.env.VITE_ROCKET_NUMBER || '[Your Rocket Number]'}`,
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact us at majasem@mail.itcpr.org',
          ],
        },
        'Bank Transfer': {
          title: 'Bank Transfer (BDT)',
          instructions: [
            `Account Name: ${import.meta.env.VITE_BANK_ACCOUNT_NAME_BDT || '[Account Name]'}`,
            `Account Number: ${import.meta.env.VITE_BANK_ACCOUNT_NUMBER_BDT || '[Account Number]'}`,
            `Bank Name: ${import.meta.env.VITE_BANK_NAME_BDT || '[Bank Name]'}`,
            `Branch: ${import.meta.env.VITE_BANK_BRANCH_BDT || '[Branch Name]'}`,
            `Include reference: ${userEmail}`,
            'Please wait for payment processing after sending',
            'If you forgot to include the reference, contact us at majasem@mail.itcpr.org',
          ],
        },
        Cash: {
          title: 'Cash Payment',
          instructions: [
            'Cash payments can be made in person',
            'Please contact us at majasem@mail.itcpr.org to arrange a meeting',
            'Always request a receipt for cash payments',
          ],
        },
        Other: {
          title: 'Other Payment Method',
          instructions: [
            'Please contact us at majasem@mail.itcpr.org for alternative payment arrangements',
            'We accept various payment methods based on your location',
          ],
        },
      },
    };
  };

  const paymentInstructions = getPaymentInstructions();

  useEffect(() => {
    // Don't load if auth is still loading
    if (authLoading) {
      return;
    }
    
    // Only load if we have a user
    if (!user || !user?.uid) {
      hasLoadedRef.current = false;
      return;
    }
    
    // Prevent duplicate loads for the same user
    if (hasLoadedRef.current === user.uid) {
      return;
    }
    
    // Load dashboard data (userData might be null if user doesn't exist in Firestore, that's ok)
    loadDashboardData();
  }, [user?.uid, authLoading]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    // Mark as loaded for this user
    hasLoadedRef.current = user.uid;
    
    setLoading(true);
    try {
      // Get fee settings from userData
      const monthlyFeeUSD = userData?.monthlyFeeUSD;
      const monthlyFeeBDT = userData?.monthlyFeeBDT;
      const isExempt = userData?.isExemptFromMonthlyFee || false;
      
      // Determine fee currency and amount
      const feeCurrency = monthlyFeeUSD ? 'USD' : (monthlyFeeBDT ? 'BDT' : null);
      const feeAmount = monthlyFeeUSD || monthlyFeeBDT || null;

      // Get current month/year (starting from February 2026)
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      
      // Only check for months starting from February 2026
      if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 1)) {
        setStats({ 
          pendingPayments: 0, 
          pendingMonths: [],
          totalDue: 0,
          feeCurrency,
          feeAmount,
          isWaived: isExempt,
        });
        setRecentPayments([]);
        return;
      }

      // Calculate all months from February 2026 to current month
      const monthsToCheck = [];
      const startYear = 2026;
      const startMonth = 1; // February
      
      for (let year = startYear; year <= currentYear; year++) {
        const monthStart = year === startYear ? startMonth : 0;
        const monthEnd = year === currentYear ? currentMonth : 11;
        
        for (let month = monthStart; month <= monthEnd; month++) {
          const monthStartDate = new Date(year, month, 1);
          const monthEndDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
          monthsToCheck.push({
            year,
            month,
            start: monthStartDate,
            end: monthEndDate,
            label: monthStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          });
        }
      }

      // Get all monthly_fee payments for this user from February 2026 onwards
      const feb2026Start = new Date(2026, 1, 1);
      const { data: allPayments, error: allPaymentsError } = await supabaseClient
        .from('finances')
        .select('*')
        .eq('type', 'income')
        .eq('category', 'monthly_fee')
        .eq('user', user.uid)
        .gte('created_at', feb2026Start.toISOString())
        .order('created_at', { ascending: false });

      if (allPaymentsError) throw allPaymentsError;

      // Check which months have payments
      const paidMonths = new Set();
      allPayments?.forEach((payment) => {
        const paymentDate = new Date(payment.created_at);
        const paymentYear = paymentDate.getFullYear();
        const paymentMonth = paymentDate.getMonth();
        paidMonths.add(`${paymentYear}-${paymentMonth}`);
      });

      // Find pending months
      const pendingMonths = monthsToCheck.filter(({ year, month }) => {
        return !paidMonths.has(`${year}-${month}`);
      });

      // Calculate total due amount
      const totalDue = isExempt || !feeAmount ? 0 : pendingMonths.length * parseFloat(feeAmount);

      setStats({ 
        pendingPayments: pendingMonths.length,
        pendingMonths: pendingMonths.map(m => m.label),
        totalDue,
        feeCurrency,
        feeAmount: feeAmount ? parseFloat(feeAmount) : null,
        isWaived: isExempt,
      });
      
      // Map finances data structure to display format
      // Show recent payments (limit to 10)
      const recentFees = (allPayments || []).slice(0, 10);
      setRecentPayments(recentFees.map(fee => ({
        id: fee.id,
        description: fee.description || 'Monthly Fee',
        amount: fee.amount,
        type: fee.type, // 'income' for monthly fees
        category: fee.category, // 'monthly_fee'
        status: 'paid', // All payments in DB are paid
        currency: fee.currency || 'USD',
        payment_method: fee.description || 'N/A',
        created_at: fee.created_at
      })));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowPaymentInfo = (currency, method) => {
    setSelectedCurrency(currency);
    setSelectedMethod(method);
    setShowPaymentInfo(true);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatPaymentDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getPaymentMonth = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>
          <div className={styles.loaderSpinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Hero Section with Gradient Background */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Payment <span className={styles.gradientText}>Portal</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Manage payments and view payment methods in one place
            </p>
          </div>
          {stats.isWaived ? (
            <div className={styles.statBadge}>
              <div className={styles.statBadgeIcon} style={{ background: 'linear-gradient(135deg, var(--success-lighter) 0%, rgba(76, 175, 80, 0.2) 100%)', color: 'var(--success)' }}>
                <span className="material-icons">verified</span>
              </div>
              <div className={styles.statBadgeContent}>
                <span className={styles.statBadgeLabel}>Fee Status</span>
                <span className={styles.statBadgeValue}>Waived</span>
                <span className={styles.statBadgeSubtext}>You are exempt from monthly fees</span>
              </div>
            </div>
          ) : stats.pendingPayments > 0 ? (
            <div className={styles.statBadge}>
              <div className={styles.statBadgeIcon}>
                <span className="material-icons">pending_actions</span>
              </div>
              <div className={styles.statBadgeContent}>
                <span className={styles.statBadgeLabel}>
                  {stats.pendingPayments === 1 
                    ? 'Payment Due' 
                    : `${stats.pendingPayments} Payments Due`}
                </span>
                <span className={styles.statBadgeValue}>
                  {stats.totalDue > 0 && stats.feeCurrency
                    ? formatCurrency(stats.totalDue, stats.feeCurrency)
                    : stats.pendingMonths.length > 0 
                    ? stats.pendingMonths[stats.pendingMonths.length - 1] 
                    : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                {stats.pendingMonths.length > 1 && (
                  <span className={styles.statBadgeSubtext}>
                    {stats.totalDue > 0 && stats.feeCurrency
                      ? `${stats.pendingMonths.length} month${stats.pendingMonths.length > 1 ? 's' : ''} pending`
                      : `+ ${stats.pendingMonths.length - 1} more month${stats.pendingMonths.length - 1 > 1 ? 's' : ''}`}
                  </span>
                )}
                {stats.feeAmount && stats.feeCurrency && (
                  <span className={styles.statBadgeSubtext} style={{ marginTop: '0.25rem' }}>
                    {formatCurrency(stats.feeAmount, stats.feeCurrency)} per month
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.statBadge}>
              <div className={styles.statBadgeIcon} style={{ background: 'linear-gradient(135deg, var(--success-lighter) 0%, rgba(76, 175, 80, 0.2) 100%)', color: 'var(--success)' }}>
                <span className="material-icons">check_circle</span>
              </div>
              <div className={styles.statBadgeContent}>
                <span className={styles.statBadgeLabel}>All Paid</span>
                <span className={styles.statBadgeValue}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className={styles.heroDecoration}>
          <div className={styles.decorationCircle}></div>
          <div className={styles.decorationCircle}></div>
          <div className={styles.decorationCircle}></div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Pending Payments Section */}
        {!stats.isWaived && stats.pendingPayments > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionHeaderIcon}>
                <span className="material-icons">pending_actions</span>
              </div>
              <div>
                <h2 className={styles.sectionTitle}>Pending Payments</h2>
                <p className={styles.sectionSubtitle}>
                  {stats.totalDue > 0 && stats.feeCurrency
                    ? `Total due: ${formatCurrency(stats.totalDue, stats.feeCurrency)}`
                    : `${stats.pendingPayments} month${stats.pendingPayments > 1 ? 's' : ''} pending`}
                </p>
              </div>
            </div>
            
            <div className={styles.paymentsList}>
              {stats.pendingMonths.map((month, index) => (
                <div 
                  key={month}
                  className={`${styles.paymentItem} ${styles.pendingItem}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={styles.paymentIcon} style={{ background: 'var(--warning-lighter)', color: 'var(--warning)' }}>
                    <span className="material-icons">schedule</span>
                  </div>
                  <div className={styles.paymentDetails}>
                    <div className={styles.paymentHeader}>
                      <h4 className={styles.paymentTitle}>Monthly Fee - {month}</h4>
                      <span className={`${styles.paymentMonthBadge} ${styles.pendingBadge}`}>Due</span>
                    </div>
                    <div className={styles.paymentMeta}>
                      <span className={styles.paymentDate}>
                        <span className="material-icons">calendar_today</span>
                        {month}
                      </span>
                    </div>
                  </div>
                  <div className={styles.paymentAmount}>
                    {stats.feeAmount && stats.feeCurrency ? (
                      <>
                        <span className={`${styles.amount} ${styles.expense}`}>
                          {formatCurrency(stats.feeAmount, stats.feeCurrency)}
                        </span>
                        <span className={`${styles.statusBadge} ${styles.pending}`}>
                          <span className="material-icons">schedule</span>
                          Pending
                        </span>
                      </>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.pending}`}>
                        <span className="material-icons">schedule</span>
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Payments Section */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderIcon}>
              <span className="material-icons">history</span>
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Payment History</h2>
              <p className={styles.sectionSubtitle}>Your monthly fee payment records</p>
            </div>
          </div>
          
          {recentPayments.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <span className="material-icons">receipt_long</span>
              </div>
              <h3>No Payment History</h3>
              <p>Your payment records will appear here once you make a payment</p>
            </div>
          ) : (
            <div className={styles.paymentsList}>
              {recentPayments.map((payment, index) => {
                const paymentMonth = getPaymentMonth(payment.created_at);
                
                return (
                  <div 
                    key={payment.id}
                    className={styles.paymentItem}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                      <div className={styles.paymentIcon}>
                        <span className="material-icons">check_circle</span>
                      </div>
                      <div className={styles.paymentDetails}>
                        <div className={styles.paymentHeader}>
                          <h4 className={styles.paymentTitle}>Monthly Fee Payment</h4>
                          <span className={styles.paymentMonthBadge}>{paymentMonth}</span>
                        </div>
                        <div className={styles.paymentMeta}>
                          <span className={styles.paymentDate}>
                            <span className="material-icons">calendar_today</span>
                            {formatPaymentDate(payment.created_at)}
                          </span>
                          {payment.payment_method && payment.payment_method !== 'N/A' && (
                            <>
                              <span className={styles.paymentDivider}>•</span>
                              <span className={styles.paymentMethod}>
                                <span className="material-icons">payment</span>
                                {payment.payment_method}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={styles.paymentAmount}>
                        <span className={`${styles.amount} ${styles.income}`}>
                          {formatCurrency(Math.abs(parseFloat(payment.amount) || 0), payment.currency || 'USD')}
                        </span>
                        <span className={`${styles.statusBadge} ${styles.paid}`}>
                          <span className="material-icons">verified</span>
                          Paid
                        </span>
                      </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods Section */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderIcon}>
              <span className="material-icons">account_balance_wallet</span>
            </div>
            <div>
              <h2 className={styles.sectionTitle}>Payment Methods</h2>
              <p className={styles.sectionSubtitle}>Choose your preferred payment option</p>
            </div>
          </div>

          <div className={styles.currencyToggle}>
            <button
              className={`${styles.currencyBtn} ${selectedCurrency === 'BDT' ? styles.active : ''}`}
              onClick={() => setSelectedCurrency('BDT')}
            >
              BDT
            </button>
            <button
              className={`${styles.currencyBtn} ${selectedCurrency === 'USD' ? styles.active : ''}`}
              onClick={() => setSelectedCurrency('USD')}
            >
              USD
            </button>
          </div>

          <div className={styles.methodsGrid}>
            {paymentMethods[selectedCurrency]?.map((method, index) => (
              <div
                key={method}
                className={styles.methodCard}
                onClick={() => handleShowPaymentInfo(selectedCurrency, method)}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className={styles.methodCardGradient}></div>
                <div className={styles.methodCardContent}>
                  <div className={styles.methodIcon}>
                    <PaymentMethodIcon method={method} />
                  </div>
                  <h3 className={styles.methodName}>{method}</h3>
                  <p className={styles.methodHint}>Tap to view details</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Instructions Modal */}
      {showPaymentInfo && selectedMethod && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentInfo(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <div className={styles.modalIcon}>
                  <PaymentMethodIcon method={selectedMethod} />
                </div>
                <div>
                  <h2 className={styles.modalTitle}>
                    {paymentInstructions[selectedCurrency]?.[selectedMethod]?.title || selectedMethod}
                  </h2>
                  <p className={styles.modalSubtitle}>Payment instructions</p>
                </div>
              </div>
              <button 
                className={styles.modalClose}
                onClick={() => setShowPaymentInfo(false)}
                aria-label="Close"
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.instructionsList}>
                {paymentInstructions[selectedCurrency]?.[selectedMethod]?.instructions?.map((instruction, index) => (
                  <div 
                    key={index} 
                    className={styles.instructionItem}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={styles.instructionNumber}>{index + 1}</div>
                    <p className={styles.instructionText}>{instruction}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.modalButton}
                onClick={() => setShowPaymentInfo(false)}
              >
                <span className="material-icons">check</span>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

