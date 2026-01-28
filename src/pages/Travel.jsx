import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseServiceClient } from '../config/supabase';
import styles from './Travel.module.css';

const STATUS_LABELS = {
  submitted: 'Submitted',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

const STATUS_STYLES = {
  submitted: styles.statusSubmitted,
  approved: styles.statusApproved,
  paid: styles.statusPaid,
  rejected: styles.statusRejected,
};

const TRIP_TYPES = [
  { value: '', label: 'Select trip type' },
  { value: 'conference', label: 'Conference / Seminar' },
  { value: 'research', label: 'Research / Fieldwork' },
  { value: 'training', label: 'Training / Workshop' },
  { value: 'professional', label: 'Professional development' },
  { value: 'other', label: 'Other' },
];

const FUNDING_SOURCES = [
  { value: '', label: 'Select funding source' },
  { value: 'grant', label: 'ITCPR Grant' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

const Travel = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    trip_type: '',
    destination: '',
    start_date: '',
    end_date: '',
    purpose: '',
    travel_notes: '',
    estimated_amount: '',
    currency: 'USD',
    funding_source: '',
    finance_notes: '',
  });

  const loadRequests = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const { data, error } = await supabaseServiceClient
        .from('travel_requests')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading travel requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      trip_type: '',
      destination: '',
      start_date: '',
      end_date: '',
      purpose: '',
      travel_notes: '',
      estimated_amount: '',
      currency: 'USD',
      funding_source: '',
      finance_notes: '',
    });
    setShowForm(false);
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const { error } = await supabaseServiceClient.from('travel_requests').insert({
        user_id: user.uid,
        status: 'submitted',
        submitted_at: nowIso,
        updated_at: nowIso,
        trip_type: form.trip_type || null,
        destination: form.destination || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        purpose: form.purpose || null,
        travel_notes: form.travel_notes || null,
        estimated_amount: form.estimated_amount ? parseFloat(form.estimated_amount) : null,
        currency: form.currency || 'USD',
        funding_source: form.funding_source || null,
        finance_notes: form.finance_notes || null,
      });
      if (error) throw error;
      resetForm();
      await loadRequests();
    } catch (err) {
      console.error('Error creating travel request:', err);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—');

  const getTripTypeLabel = (v) => TRIP_TYPES.find((t) => t.value === v)?.label || v || '—';
  const getFundingLabel = (v) => FUNDING_SOURCES.find((f) => f.value === v)?.label || v || '—';

  return (
    <div className={styles.page}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Travel <span className={styles.gradientText}>Portal</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Submit travel authorization requests with itinerary and budget details
            </p>
          </div>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setShowForm(true)}
          >
            <span className="material-icons">add</span>
            New travel request
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {showForm && (
          <section className={styles.section}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Travel Authorization Request</h2>
              <p className={styles.formRequiredNote}>
                <span className={styles.requiredAsterisk}>*</span> Required fields
              </p>
            </div>

            <form onSubmit={handleSubmitNew} className={styles.form}>
              {/* Section 1: Trip information */}
              <div className={styles.formBlock}>
                <h3 className={styles.formBlockTitle}>
                  <span className="material-icons">flight_takeoff</span>
                  Trip information
                </h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="trip_type">
                      Trip type <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <select
                      id="trip_type"
                      name="trip_type"
                      value={form.trip_type}
                      onChange={handleChange}
                      required
                    >
                      {TRIP_TYPES.map((opt) => (
                        <option key={opt.value || 'empty'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="destination">
                      Destination (city, country) <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      id="destination"
                      name="destination"
                      type="text"
                      value={form.destination}
                      onChange={handleChange}
                      placeholder="e.g. Boston, USA"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="start_date">
                      Departure date <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="end_date">
                      Return date <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={form.end_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroupFull}>
                    <label htmlFor="purpose">
                      Purpose / justification <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <p className={styles.helpText}>
                      Briefly describe the purpose of the trip and how it relates to your role or program.
                    </p>
                    <textarea
                      id="purpose"
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. Presenting at the Annual Conference; attending fieldwork for thesis data collection."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Itinerary & additional details */}
              <div className={styles.formBlock}>
                <h3 className={styles.formBlockTitle}>
                  <span className="material-icons">route</span>
                  Itinerary & additional details
                </h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroupFull}>
                    <label htmlFor="travel_notes">Itinerary or travel notes (optional)</label>
                    <p className={styles.helpText}>
                      Flight details, accommodation, meetings, or any other relevant information.
                    </p>
                    <textarea
                      id="travel_notes"
                      name="travel_notes"
                      value={form.travel_notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. Flight: XYZ 123, Jan 15–20. Hotel: ABC Inn. Meeting with Prof. Smith on Jan 16."
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Budget & funding */}
              <div className={styles.formBlock}>
                <h3 className={styles.formBlockTitle}>
                  <span className="material-icons">account_balance</span>
                  Budget & funding
                </h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="estimated_amount">
                      Estimated total cost <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <input
                      id="estimated_amount"
                      name="estimated_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.estimated_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="currency">Currency</label>
                    <select
                      id="currency"
                      name="currency"
                      value={form.currency}
                      onChange={handleChange}
                    >
                      <option value="USD">USD</option>
                      <option value="BDT">BDT</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="funding_source">
                      Funding source <span className={styles.requiredAsterisk}>*</span>
                    </label>
                    <select
                      id="funding_source"
                      name="funding_source"
                      value={form.funding_source}
                      onChange={handleChange}
                      required
                    >
                      {FUNDING_SOURCES.map((opt) => (
                        <option key={opt.value || 'empty'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroupFull}>
                    <label htmlFor="finance_notes">Budget breakdown or finance notes (optional)</label>
                    <p className={styles.helpText}>
                      e.g. Travel $X, accommodation $Y, registration $Z; or grant/project code.
                    </p>
                    <textarea
                      id="finance_notes"
                      name="finance_notes"
                      value={form.finance_notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Transport: $500 | Accommodation: $800 | Registration: $200"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton} disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Your travel requests</h2>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : requests.length === 0 ? (
            <p className={styles.empty}>No travel requests yet. Use “New travel request” to submit one.</p>
          ) : (
            <ul className={styles.list}>
              {requests.map((req) => (
                <li key={req.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {req.destination || 'Untitled trip'}
                    </h3>
                    <span className={`${styles.statusBadge} ${STATUS_STYLES[req.status] || styles.statusDraft}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </div>
                  <div className={styles.cardMeta}>
                    {req.trip_type && (
                      <span className={styles.cardMetaItem}>{getTripTypeLabel(req.trip_type)}</span>
                    )}
                    <span className={styles.cardMetaItem}>
                      {formatDate(req.start_date)} – {formatDate(req.end_date)}
                    </span>
                    {req.purpose && (
                      <span className={styles.cardMetaItem}> • {req.purpose}</span>
                    )}
                  </div>
                  <div className={styles.cardFinance}>
                    <span className="material-icons">payments</span>
                    {formatCurrency(req.estimated_amount, req.currency)}
                    {req.funding_source && (
                      <span className={styles.cardFunding}> • {getFundingLabel(req.funding_source)}</span>
                    )}
                  </div>
                  {req.travel_notes && (
                    <p className={styles.cardNotes}>{req.travel_notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default Travel;
