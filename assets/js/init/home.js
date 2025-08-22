export default function initDeviceStatus(apiEndpoint) {
    const deviceTemplate = `
      <div class="device-chip" title="">
        <span class="device-dot"></span>
        <span class="device-icon" aria-hidden="true"></span>
        <span class="device-app"></span>
        <span class="device-sync"></span>
      </div>
    `;
  
    function createDeviceElement() {
        const template = document.createElement('template');
        template.innerHTML = deviceTemplate.trim();
        const element = template.content.firstChild;
        return element;
      }
  
    function updateDeviceStatus(device, element) {
      const dot = element.querySelector('.device-dot');
      const icon = element.querySelector('.device-icon');
      const app = element.querySelector('.device-app');
      const sync = element.querySelector('.device-sync');

      const fullTimestamp = formatFullDate(device.last_sync);
      const relative = formatRelativeTime(device.last_sync);

      // Tooltip with name and full timestamp (custom only, no native title)
      const tooltip = `${device.name || 'Unknown'} • ${fullTimestamp}`;
      element.removeAttribute('title');
      element.setAttribute('data-tooltip', tooltip);

      if (device.is_public) {
        element.classList.remove('not-available');
        dot.className = `device-dot ${device.is_online ? 'online' : 'offline'}`;
        app.textContent = device.current_app ? truncateMiddle(device.current_app, 26) : '';
        sync.textContent = relative;
      } else {
        element.classList.add('not-available');
        dot.className = 'device-dot private';
        app.textContent = 'Private';
        sync.textContent = '';
      }

      // Minimal icon: first letter of device name
      const initial = (device.name || '?').trim().charAt(0).toUpperCase();
      icon.textContent = initial;
      icon.setAttribute('aria-label', device.name || 'Device');

      // Remove any native titles from children to avoid default tooltip
      const children = element.querySelectorAll('*');
      children.forEach(child => {
        child.removeAttribute('title');
      });
    }
  
    function createSkeletonChip() {
      const wrapper = document.createElement('div');
      wrapper.className = 'device-chip skeleton';
      wrapper.innerHTML = `
        <span class="device-dot"></span>
        <span class="device-icon"></span>
        <span class="device-app"></span>
        <span class="device-sync"></span>
      `;
      return wrapper;
    }

    function renderSkeletons(count = 3) {
      const container = document.getElementById('device-container');
      if (!container) return;
      container.style.display = 'flex';
      container.innerHTML = '';
      for (let i = 0; i < count; i += 1) {
        container.appendChild(createSkeletonChip());
      }
    }

    function formatFullDate(dateString) {
      if (!dateString) return 'Never';
      const d = new Date(dateString);
      return d.toLocaleString();
    }

    function formatRelativeTime(dateString) {
      if (!dateString) return 'never';
      const now = Date.now();
      const then = new Date(dateString).getTime();
      const diff = Math.max(0, now - then);

      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;

      if (diff < minute) return 'just now';
      if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
      if (diff < day) return `${Math.floor(diff / hour)}h ago`;
      return `${Math.floor(diff / day)}d ago`;
    }

    function truncateMiddle(text, max) {
      if (!text) return '';
      if (text.length <= max) return text;
      const half = Math.floor((max - 1) / 2);
      return text.slice(0, half) + '…' + text.slice(text.length - half);
    }
  
    function fetchAndUpdateDevices() {
        // show skeletons before request (first load or refresh)
        renderSkeletons(3);
        fetch(apiEndpoint)
          .then(response => response.json())
          .then(data => {
            const container = document.getElementById('device-container');
            container.innerHTML = '';
            if (!data || !Array.isArray(data.devices) || data.devices.length === 0) {
              container.style.display = 'none';
              return;
            }
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
            container.style.display = 'flex';
          })
          .catch(error => {
            console.error('Error fetching device status:', error);
            const container = document.getElementById('device-container');
            if (container) {
              container.style.display = 'none';
            }
          });
      }
  
    fetchAndUpdateDevices();
    const intervalId = setInterval(fetchAndUpdateDevices, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }