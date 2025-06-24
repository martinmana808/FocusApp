console.log('[User] user.js loaded');
import { authManager } from './auth.js';

export async function renderUserProfile() {
  console.log('[User] Rendering user profile...');
  const profileSection = document.getElementById('profile-section');
  const isAuthenticated = await authManager.isAuthenticated();
  console.log('[User] isAuthenticated:', isAuthenticated);
  if (!profileSection) {
    console.warn('[User] profile-section not found in DOM');
    return;
  }
  
  // Clear previous content
  profileSection.innerHTML = '';

  if (isAuthenticated) {
    const user = await authManager.getUser();
    console.log('[User] Rendering authenticated user:', user);
    profileSection.innerHTML = `
      <div class="bg-white rounded shadow p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <img src="${user.picture}" alt="User Avatar" class="w-full h-full object-cover object-top" />
          </div>
          <span class="font-medium">${user.given_name || ''} ${user.family_name || ''}</span>
        </div>
        <button id="logoutBtn" class="text-gray-600 hover:text-primary transition-colors px-3 py-1.5 rounded-button border border-gray-300 text-sm whitespace-nowrap">
          <i class="ri-logout-box-line mr-1"></i> Logout
        </button>
      </div>
      </div>
    `;
    document.getElementById('logoutBtn').onclick = () => authManager.logout();
  } else {
    console.log('[User] Rendering guest (not authenticated)');
    profileSection.innerHTML = `
      <div class="bg-white rounded shadow p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <i class="ri-user-line text-2xl text-gray-400 flex items-center justify-center w-full h-full"></i>
          </div>
          <span class="font-medium text-gray-500">Guest</span>
        </div>
        <button id="loginBtn" class="text-white bg-primary hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-button text-sm whitespace-nowrap">
          <i class="ri-login-box-line mr-1"></i> Log in
        </button>
      </div>
      </div>
    `;
    document.getElementById('loginBtn').onclick = () => authManager.login();
  }
}

console.log('[User] Looking for #profile-section:', document.getElementById('profile-section'));
renderUserProfile(); 
