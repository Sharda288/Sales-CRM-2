const USERS = {
  manager: { id: 'mgr1', name: 'Alice (Manager)', role: 'manager', team_id: 'all' },
  team_lead: { id: 'tl1', name: 'Bob (Team Lead - Alpha)', role: 'team_lead', team_id: 'team_alpha' },
  employee: { id: 'emp1', name: 'Charlie (Employee - Alpha)', role: 'employee', team_id: 'team_alpha' }
};

class Auth {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('crm_current_user'));
  }

  login(roleKey) {
    const user = USERS[roleKey];
    if (user) {
      this.currentUser = user;
      localStorage.setItem('crm_current_user', JSON.stringify(user));
      db.logAudit('login', 'User logged in', user);
      return true;
    }
    return false;
  }

  logout() {
    if (this.currentUser) {
      db.logAudit('logout', 'User logged out', this.currentUser);
    }
    this.currentUser = null;
    localStorage.removeItem('crm_current_user');
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

const auth = new Auth();
