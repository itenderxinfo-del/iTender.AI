import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from './services/navigation.service';
import { AuthService } from './services/auth.service';
import { DataService } from './services/data.service';
import { ThemeService } from './services/theme.service';
import { LoginComponent } from './components/auth/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { MeasureUnitsComponent } from './components/measure-units/measure-units.component';



interface DropdownState {
  settings: boolean;
  notifications: boolean;
  profile: boolean;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, LoginComponent, DashboardComponent, MeasureUnitsComponent],
  template: `
    @if (!authService.isAuthenticated()) {
    <app-login />
    } @else if (dataService.hasLoadingError()) {
    <div class="error-container">
      <div class="error-card">
        <h2>❌ Server Connection Error</h2>
        <p>{{ dataService.hasLoadingError() }}</p>
        <div class="error-actions">
          <button class="retry-button" (click)="retryConnection()">
            Retry Connection
          </button>
        </div>
      </div>
    </div>
    } @else {
    <div class="app">
      <header class="header">
        <div class="container">
          <h1 class="logo">iTenderX</h1>
          <nav class="nav">
            <button
              class="nav-button"
              [class.active]="currentView() === 'dashboard'"
              (click)="navigateToDashboard()"
            >
              🏠 Home
            </button>
            <button
              class="nav-button"
              [class.active]="currentView() === 'customers'"
              (click)="navigateToCustomers()"
            >
              👥 My Tenders
            </button>
            <button
              class="nav-button"
              [class.active]="currentView() === 'companies'"
              (click)="navigateToCompanies()"
            >
              🏢 Browse Tenders
            </button>
            <button
              class="nav-button"
              [class.active]="currentView() === 'all-projects'"
              (click)="navigateToAllProjects()"
            >
              🗂️ Create Tender
            </button>

            <!-- Settings Dropdown -->
            <div class="dropdown" [class.active]="dropdownState.settings">
              <button
                class="nav-button dropdown-toggle"
                [class.active]="isSettingsActive()"
                (click)="toggleDropdown('settings')"
              >
                ⚙️ Settings ▼
              </button>
              <div class="dropdown-menu">
                <button
                  class="dropdown-item"
                  (click)="navigateToCompanies(); closeDropdowns()"
                >
                  🏢 Members
                </button>
                <button
                  class="dropdown-item"
                  (click)="navigateToCustomers(); closeDropdowns()"
                >
                  👥 Categories
                </button>
                <button
                  class="dropdown-item"
                  (click)="navigateToLocations(); closeDropdowns()"
                >
                  📍 Tender Types
                </button>
                @if (authService.isAdmin()) {
                <button
                  class="dropdown-item"
                  (click)="navigateToUsers(); closeDropdowns()"
                >
                  👤 Items
                </button>
                }
                <button
                  class="dropdown-item"
                  (click)="navigateToAuthorities(); closeDropdowns()"
                >
                  🛡️ Authorities
                </button>
                <button
                  class="dropdown-item"
                  (click)="navigateToMeasureUnits(); closeDropdowns()"
                >
                  📏 Measure Units
                </button>
                <button
                  class="dropdown-item"
                  (click)="navigateToActivityLog(); closeDropdowns()"
                >
                  📊 Conditions
                </button>
                
              </div>
            </div>

            <!-- Notifications Dropdown -->
            <div class="dropdown" [class.active]="dropdownState.notifications">
              <button
                class="nav-button dropdown-toggle notification-btn"
                (click)="toggleDropdown('notifications')"
              >
                🔔 @if (getUserTasks().length > 0) {
                <span class="notification-badge">{{
                  getUserTasks().length
                }}</span>
                }
              </button>
              <div class="dropdown-menu notifications-menu">
                <div class="dropdown-header">My Tasks</div>
                @if (getUserTasks().length === 0) {
                <div class="dropdown-item no-tasks">No tasks assigned</div>
                } @else { @for (task of getUserTasks(); track task.id) {
                <div
                  class="dropdown-item task-item"
                  (click)="navigateToTask(task); closeDropdowns()"
                >
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-project">
                    {{ getProjectTitle(task.projectId) }}
                  </div>
                  <div class="task-status" [class]="'status-' + task.status">
                    {{ task.status }}
                  </div>
                </div>
                } }
              </div>
            </div>

            <!-- User Profile Dropdown -->
            <div class="dropdown" [class.active]="dropdownState.profile">
              <button
                class="nav-button dropdown-toggle profile-btn"
                (click)="toggleDropdown('profile')"
              >
                <div class="user-avatar">
                  {{ (authService.user()?.name ?? "").charAt(0).toUpperCase() }}
                </div>
              </button>
              <div class="dropdown-menu profile-menu">
                <div class="dropdown-header">
                  <div class="user-name">{{ authService.user()?.name }}</div>
                  <div
                    class="user-role"
                    [class]="'role-' + authService.user()?.role"
                  >
                    {{ authService.user()?.role | titlecase }}
                  </div>
                </div>
                <div class="theme-selector">
                  <div class="dropdown-header">Theme</div>
                  <button
                    class="dropdown-item theme-item"
                    [class.active]="themeService.theme() === 'light'"
                    (click)="setTheme('light')"
                  >
                    ☀️ Light
                  </button>
                  <button
                    class="dropdown-item theme-item"
                    [class.active]="themeService.theme() === 'dark'"
                    (click)="setTheme('dark')"
                  >
                    🌙 Dark
                  </button>
                  <button
                    class="dropdown-item theme-item"
                    [class.active]="themeService.theme() === 'system'"
                    (click)="setTheme('system')"
                  >
                    💻 System
                  </button>
                </div>
                <button
                  class="dropdown-item"
                  (click)="viewProfile(); closeDropdowns()"
                >
                  👤 My Profile
                </button>
                <button
                  class="dropdown-item"
                  (click)="changePassword(); closeDropdowns()"
                >
                  ⚙️ Change Password
                </button>
                <div class="dropdown-divider"></div>
                <button
                  class="dropdown-item logout-item"
                  (click)="logout(); closeDropdowns()"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main class="main">
        @switch (currentView()) { @case ('dashboard') {
        <app-dashboard />
        } @case ('users') { } @case ('companies') { } @case ('customers') { }
        @case ('projects') { } @case ('tasks') { } @case ('steps') { } @case
        ('locations') { } @case ('authorities') { } @case ('all-projects') { }
        @case ('activity-log') { } @case ('company-activity-log') { } @case
        ('industries') { } @case ('activities') { } @case ('measure-units') {
        <app-measure-units />
        } }
      </main>
    </div>
    }
  `,
  styles: [
    `
      .app {
        min-height: 100vh;
        background: var(--background);
      }

      .header {
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        display: flex;
        align-items: center;
        height: 4rem;
        gap: 2rem;
      }

      .logo {
        color: var(--primary);
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        letter-spacing: -0.5px;
      }

      .nav {
        display: flex;
        gap: 1rem;
        margin-left: auto;
        align-items: center;
      }

      .nav-button {
        background: none;
        border: none;
        color: var(--text-secondary);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s;
        position: relative;
        display: flex; /* Added for icon alignment */
        align-items: center; /* Added for icon alignment */
        gap: 0.5rem; /* Added for spacing between icon and text */
      }

      .nav-button:hover {
        background: var(--surface-elevated);
        color: var(--text-primary);
      }

      .nav-button.active {
        background: var(--primary);
        color: white;
      }

      .dropdown {
        position: relative;
      }

      .dropdown-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .dropdown.active .dropdown-toggle {
        background: var(--surface-elevated);
        color: var(--text-primary);
      }

      .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        min-width: 200px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s;
        z-index: 1000;
      }

      .dropdown.active .dropdown-menu {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .dropdown-header {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .dropdown-item {
        display: flex; /* Added for icon alignment */
        align-items: center; /* Added for icon alignment */
        gap: 0.5rem; /* Added for spacing between icon and text */
        width: 100%;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        text-align: left;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 0.9rem;
      }

      .dropdown-item:hover {
        background: var(--surface-elevated);
        color: var(--text-primary);
      }

      .dropdown-divider {
        height: 1px;
        background: var(--border);
        margin: 0.5rem 0;
      }

      .notification-btn {
        position: relative;
        font-size: 1.2rem;
        padding: 0.5rem;
      }

      .notification-badge {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--error);
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
      }

      .notifications-menu {
        width: 300px;
      }

      .no-tasks {
        color: var(--text-muted);
        font-style: italic;
      }

      .task-item {
        border-bottom: 1px solid var(--border);
        padding: 1rem;
      }

      .task-item:last-child {
        border-bottom: none;
      }

      .task-title {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }

      .task-project {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }

      .task-status {
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        border-radius: 12px;
        text-transform: uppercase;
        font-weight: 600;
        display: inline-block;
      }

      .task-status.status-not-started {
        background: var(--warning-light);
        color: var(--warning);
      }

      .task-status.status-in-progress {
        background: var(--primary-light);
        color: var(--primary);
      }

      .task-status.status-finished {
        background: var(--success-light);
        color: var(--success);
      }

      .profile-btn {
        padding: 0.25rem;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .profile-menu {
        width: 220px;
      }

      .profile-menu .dropdown-header {
        text-align: center;
      }

      .user-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }

      .user-role {
        padding: 0.2rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-block;
      }

      .user-role.role-admin {
        background: var(--error-light);
        color: var(--error);
      }

      .user-role.role-manager {
        background: var(--primary-light);
        color: var(--primary);
      }

      .user-role.role-user {
        background: var(--success-light);
        color: var(--success);
      }

      .logout-item {
        color: var(--error);
      }

      .logout-item:hover {
        background: var(--error-light);
        color: var(--error);
      }

      .theme-selector {
        border-bottom: 1px solid var(--border);
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
      }

      .theme-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        position: relative;
      }

      .theme-item.active {
        background: var(--primary-light);
        color: var(--primary);
        font-weight: 500;
      }

      .theme-item.active::after {
        content: "✓"; /* Changed to raw character */
        position: absolute;
        right: 1rem;
        color: var(--primary);
        font-weight: 600;
      }

      .main {
        flex: 1;
      }

      @media (max-width: 768px) {
        .container {
          padding: 0 1rem;
          flex-wrap: wrap;
        }

        .logo {
          font-size: 1.3rem;
        }

        .nav {
          margin-left: 0;
          flex-wrap: wrap;
        }

        .dropdown-menu {
          right: auto;
          left: 0;
        }

        .notifications-menu,
        .profile-menu {
          width: 250px;
        }
      }

      @media (max-width: 480px) {
        .container {
          flex-direction: column;
          height: auto;
          padding: 1rem;
          gap: 1rem;
        }

        .nav {
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }
      }

      .error-container {
        min-height: 100vh;
        background: var(--background);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }

      .error-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        text-align: center;
        box-shadow: var(--shadow-lg);
      }

      .error-card h2 {
        color: var(--error);
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .error-icon {
        color: var(--error);
      }

      .error-card p {
        color: var(--text-secondary);
        margin: 0 0 2rem 0;
        line-height: 1.6;
      }

      .error-actions {
        display: flex;
        justify-content: center;
      }

      .retry-button {
        background: var(--primary);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .retry-button:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
      }
    `,
  ],
})
export class AppComponent {
  public navigationService = inject(NavigationService); // Changed to public
  public authService = inject(AuthService);
  public dataService = inject(DataService);
  public themeService = inject(ThemeService);

  dropdownState: DropdownState = {
    settings: false,
    notifications: false,
    profile: false,
  };

  readonly currentView = computed(
    () => this.navigationService.currentState().currentView
  );

  ngOnInit(): void {
    // Close dropdowns when clicking outside
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown")) {
        this.closeDropdowns();
      }
    });
  }

  navigateToUsers(): void {
    this.navigationService.navigateToUsers();
  }

  navigateToCompanies(): void {
    this.navigationService.navigateToAllCompanies();
  }

  navigateToCustomers(): void {
    this.navigationService.navigateToCustomers();
  }

  navigateToDashboard(): void {
    this.navigationService.navigateToDashboard();
  }

  navigateToLocations(): void {
    this.navigationService.navigateToLocations();
  }

  navigateToAuthorities(): void {
    this.navigationService.navigateToAuthorities();
  }

  navigateToAllProjects(): void {
    this.navigationService.navigateToAllProjects();
  }

  navigateToActivityLog(): void {
    this.navigationService.navigateToActivityLog();
  }

  navigateToCompanyActivityLog(): void {
    this.navigationService.navigateToCompanyActivityLog();
  }

  navigateToIndustries(): void {
    this.navigationService.navigateToIndustries();
  }

  navigateToMeasureUnits(): void {
    this.navigationService.navigateToMeasureUnits();
  }

  toggleDropdown(dropdown: keyof DropdownState): void {
    // Close all other dropdowns
    Object.keys(this.dropdownState).forEach((key) => {
      if (key !== dropdown) {
        this.dropdownState[key as keyof DropdownState] = false;
      }
    });

    // Toggle the selected dropdown
    this.dropdownState[dropdown] = !this.dropdownState[dropdown];
  }

  closeDropdowns(): void {
    this.dropdownState = {
      settings: false,
      notifications: false,
      profile: false,
    };
  }

  isSettingsActive(): boolean {
    const view = this.currentView();
    return (
      view === "locations" ||
      view === "users" ||
      view === "authorities" ||
      view === "activity-log" ||
      view === "company-activity-log" ||
      view === "industries" ||
      view === "activities" ||
      view === "measure-units"
    );
  }

  getUserTasks() {
    // Get tasks assigned to current user (simplified - in real app would filter by assignee)
    return this.dataService
      .allTasks()
      .filter(
        (task) => task.status === "not-started" || task.status === "in-progress"
      )
      .slice(0, 5); // Show max 5 tasks
  }

  getProjectTitle(projectId: string): string {
    const project = this.dataService.getProjectById(projectId);
    return project ? project.title : "Unknown Project";
  }

  navigateToTask(task: any): void {
    const project = this.dataService.getProjectById(task.projectId);
    if (project) {
      this.navigationService.navigateToTasks(
        project.customerId,
        project.companyId,
        task.projectId
      );
    }
  }

  viewProfile(): void {
    // TODO: Implement profile view
    console.log("View profile");
  }

  changePassword(): void {
    // TODO: Implement change password
    const email = this.authService.user()?.email;
    if (email) {
      // For now, show a placeholder message
      alert("Change password functionality will be implemented here");
      /* Future implementation:
      this.authService.changePassword(currentPassword, newPassword).then(result => {
        if (result.success) {
          alert('Password changed successfully');
        } else {
          alert('Failed to change password: ' + result.message);
        }
      });
      */
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeDropdowns();
  }

  retryConnection(): void {
    window.location.reload();
  }

  setTheme(theme: "light" | "dark" | "system"): void {
    this.themeService.setTheme(theme);
  }
}