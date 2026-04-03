// Wealth Manager - Main JavaScript Application
// Mobile-first design with interactive calculations and account switching

class WealthManager {
    constructor() {
        this.accounts = [];
        this.currentAccount = null;
        this.alerts = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAccountData();
        this.setupMobileOptimizations();
        this.initializeCharts();
        this.setupNotifications();
        this.setupServiceWorker();
        console.log('Wealth Manager initialized');
    }

    setupEventListeners() {
        // Account switcher
        document.addEventListener('change', (e) => {
            if (e.target.matches('.account-selector')) {
                this.switchAccount(e.target.value);
            }
        });

        // Form validation
        document.addEventListener('submit', (e) => {
            if (e.target.matches('form')) {
                this.validateForm(e);
            }
        });

        // Real-time balance calculations
        document.addEventListener('input', (e) => {
            if (e.target.matches('.amount-input')) {
                this.calculateBalance(e.target);
            }
        });

        // Mobile touch gestures
        if ('ontouchstart' in window) {
            this.setupTouchGestures();
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize for responsive adjustments
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Working offline', 'warning');
        });
    }

    loadAccountData() {
        // Load account data and update UI
        fetch('/api/dashboard_data')
            .then(response => response.json())
            .then(data => {
                this.accounts = data.accounts || [];
                this.updateAccountSelector();
                this.updateDashboardMetrics(data);
            })
            .catch(error => {
                console.error('Error loading account data:', error);
                this.showNotification('Failed to load account data', 'error');
            });
    }

    switchAccount(accountId) {
        this.currentAccount = accountId;
        
        // Update UI to show selected account
        this.updateAccountBalance(accountId);
        this.highlightSelectedAccount(accountId);
        
        // Store preference
        localStorage.setItem('selectedAccount', accountId);
        
        this.showNotification(`Switched to account ${accountId}`, 'info');
    }

    updateAccountBalance(accountId) {
        if (!accountId) return;

        fetch(`/api/account_balance/${accountId}`)
            .then(response => response.json())
            .then(data => {
                const balanceElements = document.querySelectorAll(`[data-account-id="${accountId}"] .balance`);
                balanceElements.forEach(element => {
                    element.textContent = `₹${this.formatAmount(data.balance)}`;
                    element.className = `balance ${data.balance >= 0 ? 'balance-positive' : 'balance-negative'}`;
                });
            })
            .catch(error => {
                console.error('Error updating balance:', error);
            });
    }

    highlightSelectedAccount(accountId) {
        // Remove previous highlights
        document.querySelectorAll('.account-card').forEach(card => {
            card.classList.remove('border-primary', 'selected-account');
        });

        // Highlight selected account
        const selectedCard = document.querySelector(`[data-account-id="${accountId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('border-primary', 'selected-account');
        }
    }

    updateAccountSelector() {
        const selectors = document.querySelectorAll('.account-selector');
        selectors.forEach(select => {
            // Clear existing options except the first
            const firstOption = select.querySelector('option');
            select.innerHTML = '';
            if (firstOption) select.appendChild(firstOption);

            // Add account options
            this.accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} - ₹${this.formatAmount(account.balance)}`;
                select.appendChild(option);
            });
        });

        // Restore selected account
        const savedAccount = localStorage.getItem('selectedAccount');
        if (savedAccount) {
            selectors.forEach(select => {
                select.value = savedAccount;
            });
            this.currentAccount = savedAccount;
        }
    }

    validateForm(event) {
        const form = event.target;
        const isValid = this.performFormValidation(form);
        
        if (!isValid) {
            event.preventDefault();
            this.showFormErrors(form);
        } else {
            this.showNotification('Form submitted successfully', 'success');
        }
    }

    performFormValidation(form) {
        let isValid = true;
        const errors = [];

        // Clear previous errors
        form.querySelectorAll('.is-invalid').forEach(element => {
            element.classList.remove('is-invalid');
        });

        // Amount validation
        const amountInputs = form.querySelectorAll('input[type="number"]');
        amountInputs.forEach(input => {
            const value = parseFloat(input.value);
            if (input.required && (!value || value <= 0)) {
                input.classList.add('is-invalid');
                errors.push(`${input.labels[0]?.textContent || input.name} must be greater than 0`);
                isValid = false;
            }
        });

        // Account selection validation
        const accountSelects = form.querySelectorAll('.account-selector');
        accountSelects.forEach(select => {
            if (select.required && !select.value) {
                select.classList.add('is-invalid');
                errors.push('Please select an account');
                isValid = false;
            }
        });

        // Date validation
        const dateInputs = form.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (input.value && new Date(input.value) < new Date()) {
                input.classList.add('is-invalid');
                errors.push('Date cannot be in the past');
                isValid = false;
            }
        });

        // Custom validation for transfers
        if (form.id === 'transferForm') {
            const fromAccount = form.querySelector('[name="from_account"]')?.value;
            const toAccount = form.querySelector('[name="to_account"]')?.value;
            
            if (fromAccount === toAccount) {
                errors.push('Source and destination accounts cannot be the same');
                isValid = false;
            }
        }

        return isValid;
    }

    showFormErrors(form) {
        const errorContainer = form.querySelector('.form-errors') || this.createErrorContainer(form);
        const errors = [];

        form.querySelectorAll('.is-invalid').forEach(element => {
            const label = element.labels[0]?.textContent || element.name;
            errors.push(`${label} has an error`);
        });

        errorContainer.innerHTML = errors.map(error => 
            `<div class="alert alert-danger alert-dismissible fade show">
                <i data-feather="alert-triangle" class="me-2"></i>
                ${error}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>`
        ).join('');

        feather.replace();
    }

    createErrorContainer(form) {
        const container = document.createElement('div');
        container.className = 'form-errors mb-3';
        form.insertBefore(container, form.firstChild);
        return container;
    }

    calculateBalance(input) {
        const form = input.closest('form');
        const accountSelect = form.querySelector('.account-selector');
        
        if (!accountSelect?.value) return;

        const account = this.accounts.find(acc => acc.id == accountSelect.value);
        if (!account) return;

        const amount = parseFloat(input.value) || 0;
        const transactionType = form.querySelector('[name="type"]')?.value;
        
        let newBalance = account.balance;
        if (transactionType === 'debit') {
            newBalance -= amount;
        } else if (transactionType === 'credit') {
            newBalance += amount;
        }

        this.updateBalancePreview(form, newBalance, amount);
        this.checkInsufficientFunds(form, account.balance, amount, transactionType);
    }

    updateBalancePreview(form, newBalance, amount) {
        let preview = form.querySelector('.balance-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'balance-preview alert mt-2';
            form.appendChild(preview);
        }

        const balanceClass = newBalance >= 0 ? 'alert-success' : 'alert-danger';
        preview.className = `balance-preview alert ${balanceClass}`;
        preview.innerHTML = `
            <i data-feather="info" class="me-2"></i>
            <strong>New Balance:</strong> ₹${this.formatAmount(newBalance)}
        `;
        feather.replace();
    }

    checkInsufficientFunds(form, currentBalance, amount, type) {
        if (type === 'debit' && amount > currentBalance) {
            this.showInsufficientFundsWarning(form, currentBalance, amount);
        } else {
            this.hideInsufficientFundsWarning(form);
        }
    }

    showInsufficientFundsWarning(form, currentBalance, amount) {
        let warning = form.querySelector('.insufficient-funds-warning');
        if (!warning) {
            warning = document.createElement('div');
            warning.className = 'insufficient-funds-warning alert alert-warning mt-2';
            form.appendChild(warning);
        }

        const shortage = amount - currentBalance;
        warning.innerHTML = `
            <i data-feather="alert-triangle" class="me-2"></i>
            <strong>Insufficient Funds:</strong> Short by ₹${this.formatAmount(shortage)}
            <div class="mt-2">
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="wealthManager.suggestFundTransfer(${shortage})">
                    <i data-feather="arrow-right" class="me-1"></i>Transfer Funds
                </button>
            </div>
        `;
        feather.replace();
    }

    hideInsufficientFundsWarning(form) {
        const warning = form.querySelector('.insufficient-funds-warning');
        if (warning) {
            warning.remove();
        }
    }

    suggestFundTransfer(amount) {
        const availableAccounts = this.accounts.filter(acc => acc.balance >= amount);
        
        if (availableAccounts.length === 0) {
            this.showNotification('No accounts with sufficient funds available', 'warning');
            return;
        }

        // Show transfer suggestion modal
        this.showTransferSuggestionModal(availableAccounts, amount);
    }

    showTransferSuggestionModal(accounts, amount) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i data-feather="arrow-right" class="me-2"></i>
                            Transfer Suggestion
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>You can transfer ₹${this.formatAmount(amount)} from:</p>
                        <div class="list-group">
                            ${accounts.map(account => `
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${account.name}</strong>
                                        <small class="d-block text-muted">Balance: ₹${this.formatAmount(account.balance)}</small>
                                    </div>
                                    <button class="btn btn-sm btn-primary" onclick="wealthManager.quickTransfer(${account.id}, ${amount})">
                                        Transfer
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        feather.replace();

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    quickTransfer(fromAccountId, amount) {
        // Redirect to add transaction page with pre-filled transfer data
        const url = new URL('/add_transaction', window.location.origin);
        url.searchParams.set('account_id', fromAccountId);
        url.searchParams.set('amount', amount);
        url.searchParams.set('type', 'transfer');
        
        window.location.href = url.toString();
    }

    setupMobileOptimizations() {
        // Add mobile-specific classes
        if (this.isMobile()) {
            document.body.classList.add('mobile-device');
            this.setupSwipeGestures();
            this.setupPullToRefresh();
        }

        // Setup viewport height fix for mobile
        this.setupViewportFix();
        
        // Add touch-friendly interactions
        this.setupTouchOptimizations();
    }

    isMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupSwipeGestures() {
        let startX, startY, endX, endY;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            endX = e.touches[0].clientX;
            endY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', () => {
            if (!startX || !startY || !endX || !endY) return;

            const diffX = startX - endX;
            const diffY = startY - endY;

            // Horizontal swipe
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.handleSwipeLeft();
                } else {
                    this.handleSwipeRight();
                }
            }

            // Reset values
            startX = startY = endX = endY = null;
        });
    }

    handleSwipeLeft() {
        // Navigate to next page or account
        console.log('Swipe left detected');
    }

    handleSwipeRight() {
        // Navigate to previous page or account
        console.log('Swipe right detected');
    }

    setupPullToRefresh() {
        let startY = 0;
        let isPulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;

            const currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;

            if (pullDistance > 100) {
                this.showPullToRefreshIndicator();
            }
        });

        document.addEventListener('touchend', () => {
            if (isPulling) {
                const pullDistance = event.changedTouches[0].clientY - startY;
                if (pullDistance > 100) {
                    this.refreshData();
                }
                this.hidePullToRefreshIndicator();
                isPulling = false;
            }
        });
    }

    showPullToRefreshIndicator() {
        let indicator = document.querySelector('.pull-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'pull-refresh-indicator';
            indicator.innerHTML = '<i data-feather="refresh-cw" class="spinning"></i> Release to refresh';
            document.body.insertBefore(indicator, document.body.firstChild);
            feather.replace();
        }
        indicator.style.display = 'block';
    }

    hidePullToRefreshIndicator() {
        const indicator = document.querySelector('.pull-refresh-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    refreshData() {
        this.showNotification('Refreshing data...', 'info');
        this.loadAccountData();
        this.checkAlerts();
    }

    setupViewportFix() {
        // Fix for mobile viewport height issues
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }

    setupTouchOptimizations() {
        // Increase touch target sizes
        const buttons = document.querySelectorAll('.btn-sm');
        buttons.forEach(btn => {
            if (this.isMobile()) {
                btn.classList.add('btn-touch');
            }
        });

        // Add haptic feedback for supported devices
        if ('vibrate' in navigator) {
            document.addEventListener('click', (e) => {
                if (e.target.matches('.btn, .nav-link, .list-group-item')) {
                    navigator.vibrate(10);
                }
            });
        }
    }

    setupTouchGestures() {
        // Additional touch gesture handling
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });

        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }

    handleKeyboardShortcuts(event) {
        // Keyboard shortcuts for power users
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'n':
                    event.preventDefault();
                    this.openQuickAddModal();
                    break;
                case 'h':
                    event.preventDefault();
                    window.location.href = '/';
                    break;
                case 'a':
                    event.preventDefault();
                    window.location.href = '/accounts';
                    break;
                case 'r':
                    event.preventDefault();
                    this.refreshData();
                    break;
            }
        }

        // Escape key handling
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }

    openQuickAddModal() {
        const modal = document.querySelector('#quickAddModal');
        if (modal) {
            new bootstrap.Modal(modal).show();
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            bootstrap.Modal.getInstance(modal)?.hide();
        });
    }

    handleResize() {
        // Handle responsive changes
        if (this.charts) {
            Object.values(this.charts).forEach(chart => {
                chart.resize();
            });
        }

        // Update mobile optimizations
        if (this.isMobile() && !document.body.classList.contains('mobile-device')) {
            document.body.classList.add('mobile-device');
            this.setupMobileOptimizations();
        } else if (!this.isMobile() && document.body.classList.contains('mobile-device')) {
            document.body.classList.remove('mobile-device');
        }
    }

    initializeCharts() {
        this.charts = {};
        
        // Initialize dashboard charts if elements exist
        const accountBalanceChart = document.getElementById('accountBalanceChart');
        if (accountBalanceChart) {
            this.createAccountBalanceChart(accountBalanceChart);
        }

        const obligationsChart = document.getElementById('obligationsChart');
        if (obligationsChart) {
            this.createObligationsChart(obligationsChart);
        }
    }

    createAccountBalanceChart(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Chart will be created by the template script
        // This is a placeholder for additional chart customizations
        console.log('Account balance chart container ready');
    }

    createObligationsChart(canvas) {
        const ctx = canvas.getContext('2d');
        
        // Chart will be created by the template script
        // This is a placeholder for additional chart customizations
        console.log('Obligations chart container ready');
    }

    setupNotifications() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Setup alert checking
        this.checkAlerts();
        setInterval(() => this.checkAlerts(), 300000); // Check every 5 minutes
    }

    checkAlerts() {
        fetch('/api/check_alerts')
            .then(response => response.json())
            .then(alerts => {
                this.processAlerts(alerts);
            })
            .catch(error => {
                console.error('Error checking alerts:', error);
            });
    }

    processAlerts(alerts) {
        const newAlerts = alerts.filter(alert => 
            !this.alerts.some(existing => existing.id === alert.id)
        );

        newAlerts.forEach(alert => {
            this.showDesktopNotification(alert);
        });

        this.alerts = alerts;
        this.updateAlertBadge(alerts.length);
    }

    showDesktopNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Wealth Manager Alert', {
                body: `${alert.account_name}: ${alert.emi_name} due tomorrow. Shortage: ₹${this.formatAmount(alert.shortage)}`,
                icon: '/static/images/icon-192.png',
                tag: alert.id,
                requireInteraction: true
            });
        }
    }

    updateAlertBadge(count) {
        const badges = document.querySelectorAll('.alert-badge, #alert-count');
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    showNotification(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0 position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 1051;';
        
        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i data-feather="${iconMap[type] || 'info'}" class="me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        document.body.appendChild(toast);
        feather.replace();

        const bsToast = new bootstrap.Toast(toast, { delay: duration });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    setupServiceWorker() {
        // Register service worker for offline capabilities
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/js/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    formatAmount(amount) {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatCurrency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    updateDashboardMetrics(data) {
        // Update total wealth
        const totalWealthElements = document.querySelectorAll('.total-wealth');
        totalWealthElements.forEach(element => {
            element.textContent = `₹${this.formatAmount(data.total_wealth || 0)}`;
        });

        // Update other metrics as needed
        console.log('Dashboard metrics updated', data);
    }
}

// Initialize the application
let wealthManager;
document.addEventListener('DOMContentLoaded', () => {
    wealthManager = new WealthManager();
});

// Global utility functions
window.wealthManager = wealthManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WealthManager;
}
