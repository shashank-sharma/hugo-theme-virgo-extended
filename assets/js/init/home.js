export default function initDeviceStatus(apiEndpoint) {
    const deviceTemplate = `
      <div class="holo-badge">
        <div class="holo-content">
          <div class="holo-header">
            <div class="holo-icon-test">
            </div>
            <div class="holo-title"></div>
          </div>
          <div class="holo-body">
            <p class="holo-sync"></p>
            <div class="holo-status">
              <span class="holo-status-dot"></span>
              <span class="holo-status-text"></span>
            </div>
            <p class="holo-current-app"></p>
          </div>
        </div>
        <div class="holo-glow"></div>
      </div>
    `;
  
    function createDeviceElement() {
        const template = document.createElement('template');
        template.innerHTML = deviceTemplate.trim();
        const element = template.content.firstChild;
    
        element.addEventListener('click', function() {
          if (window.innerWidth <= 980) {
            const allBadges = document.querySelectorAll('.holo-badge');
            const wasExpanded = this.classList.contains('expanded');
    
            // Toggle expanded state for clicked badge
            this.classList.toggle('expanded');
    
            // Adjust margins for all badges
            if (wasExpanded) {
              // Collapse
              allBadges.forEach(badge => {
                badge.style.marginBottom = '-40px';
                badge.classList.remove('expanded');
              });
            } else {
              // Expand
              allBadges.forEach(badge => {
                badge.style.marginBottom = '0px';
              });
              this.classList.add('expanded');
            }
          }
        });
    
        return element;
      }
  
    function updateDeviceStatus(device, element) {
      element.querySelector('.holo-title').textContent = device.name;
      const syncElement = element.querySelector('.holo-sync');
      const statusDot = element.querySelector('.holo-status-dot');
      const statusText = element.querySelector('.holo-status-text');
      const currentAppText = element.querySelector('.holo-current-app');
      
      if (device.is_public) {
        element.classList.remove('not-available');
        syncElement.textContent = `Last Sync: ${formatDate(device.last_sync)}`;
        statusDot.className = `holo-status-dot ${device.is_online ? 'online' : 'offline'}`;
        statusText.textContent = device.is_online ? 'Online' : 'Offline';
        currentAppText.textContent = device.current_app ? device.current_app : '';
      } else {
        element.classList.add('not-available');
        syncElement.textContent = 'Not Available';
        statusDot.className = 'holo-status-dot not-available';
        statusText.textContent = 'Private';
        currentAppText.textContent = 'Private';
      }
    }
  
    function formatDate(dateString) {
      if (!dateString) return 'Never';
      return new Date(dateString).toLocaleString();
    }
  
    function fetchAndUpdateDevices() {
        fetch(apiEndpoint)
          .then(response => response.json())
          .then(data => {
            const container = document.getElementById('device-container');
            container.innerHTML = '';
            const sortedDevices = data.devices.sort((a, b) => {

              const getDateValue = (device) => {
                return device.last_sync ? new Date(device.last_sync).getTime() : 0;
              };
      
              if (a.is_public && !b.is_public) return -1;
              if (!a.is_public && b.is_public) return 1;
              if (a.is_public && b.is_public) {
                if (a.is_online && !b.is_online) return -1;
                if (!a.is_online && b.is_online) return 1;
                
                return getDateValue(b) - getDateValue(a);
              }
      
              return getDateValue(b) - getDateValue(a);
            });
      
            sortedDevices.forEach(device => {
              const deviceElement = createDeviceElement();
              updateDeviceStatus(device, deviceElement);
              container.appendChild(deviceElement);
            });
          })
          .catch(error => console.error('Error fetching device status:', error));
      }
  
    fetchAndUpdateDevices();
    const intervalId = setInterval(fetchAndUpdateDevices, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }