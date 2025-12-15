// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Smooth Scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // Animate content sections on scroll
  const contentSections = document.querySelectorAll('.content-section');
  const options = {
    threshold: 0.1
  };

  const intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, options);

  contentSections.forEach(section => {
    intersectionObserver.observe(section);
  });

  // Prevent scrolling between sections: lock container scroll
  const contentSectionsContainer = document.getElementById('content-sections');
  if (contentSectionsContainer) {
    // Prevent any scrolling on the container itself
    contentSectionsContainer.addEventListener('scroll', function(e) {
      contentSectionsContainer.scrollTop = 0;
      contentSectionsContainer.scrollLeft = 0;
    }, { passive: false });
    
    // Prevent wheel events from scrolling the container
    contentSectionsContainer.addEventListener('wheel', function(e) {
      // Only allow scrolling within individual sections, not the container
      e.stopPropagation();
    }, { passive: false });
  }

  // Create custom sword cursor for content sections/pages & modals
  const swordCursor = document.createElement('img');
  swordCursor.src = 'assets/sword.gif';
  swordCursor.className = 'sword-cursor';
  swordCursor.alt = '';
  document.body.appendChild(swordCursor);

  // Update cursor position on content sections
  let isOnContentSection = false;
  
  function updateSwordCursor(e) {
    if (isOnContentSection) {
      swordCursor.style.left = (e.clientX - 12) + 'px'; // Offset by half width
      swordCursor.style.top = (e.clientY - 12) + 'px'; // Offset by half height
      swordCursor.style.display = 'block';
    } else {
      swordCursor.style.display = 'none';
    }
  }

  // Show/hide cursor based on whether the user is on a content section/page or a modal is open
  function checkShouldShowCursor() {
    const contentSections = document.getElementById('content-sections');
    const modal = document.getElementById('treasure-chest-modal');
    const isContentSectionVisible = contentSections && contentSections.style.display !== 'none';
    const isModalVisible = modal && modal.style.display !== 'none' && modal.style.display !== '';
    isOnContentSection = isContentSectionVisible || isModalVisible;
    if (!isOnContentSection) {
      swordCursor.style.display = 'none';
    }
  }

  const cursorObserver = new MutationObserver(function(mutations) {
    checkShouldShowCursor();
  });

  const contentSectionsEl = document.getElementById('content-sections');
  if (contentSectionsEl) {
    cursorObserver.observe(contentSectionsEl, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  const modalEl = document.getElementById('treasure-chest-modal');
  if (modalEl) {
    cursorObserver.observe(modalEl, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  // Track mouse movement
  document.addEventListener('mousemove', updateSwordCursor);
  
  // Hide cursor when mouse leaves window
  document.addEventListener('mouseleave', function() {
    swordCursor.style.display = 'none';
  });

  // Handle project button clicks
  document.querySelectorAll('.project-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // Prevent the project card click from firing
      e.stopPropagation(); 
      
      const href = this.getAttribute('href');
      if (href) {
        // Special handling for anchor links (e.g. #the-flop-video, music audio samples)
        if (href.startsWith('#')) {
          e.preventDefault();
          if (typeof window.navigateToSection === 'function') {
            const sectionId = href.substring(1); // Remove the #
            window.navigateToSection(sectionId);
          } else {
            window.location.href = href;
          }
        }
        // For external links, let the default behavior handle it (target="_blank")
      } else {
        // Prevent navigation if href is empty
        e.preventDefault(); 
      }
    });
  });

  // Make project cards clickable while allowing buttons to work independently as well
  document.querySelectorAll('.project').forEach(project => {
    project.addEventListener('click', function(e) {
      // Don't navigate if clicking on a button
      if (e.target.closest('.project-btn')) {
        return;
      }
      
      // Get the project URL from data attribute
      const projectUrl = this.getAttribute('data-project-url');
      if (projectUrl) {
        // Special handling for The Flop (anchor link to video section)
        if (projectUrl.startsWith('#')) {
          // Navigate to the video section using the portal navigation system
          if (typeof window.navigateToSection === 'function') {
            const sectionId = projectUrl.substring(1); // Remove the #
            window.navigateToSection(sectionId);
          } else {
            window.location.href = projectUrl;
          }
        } else if (projectUrl) {
          // Only open if URL is not empty
          window.open(projectUrl, '_blank');
        }
      }
    });
  });

  // Pause thunder audio when The Flop video plays
  const theFlopVideo = document.querySelector('#the-flop-video video');
  if (theFlopVideo) {
    theFlopVideo.addEventListener('play', function() {
      // Access the pause function from portal-game.js
      if (typeof window.pauseThunderAudio === 'function') {
        window.pauseThunderAudio();
      }
    });
    
    theFlopVideo.addEventListener('pause', function() {
      // Resume thunder when video is paused
      if (typeof window.resumeThunderAudio === 'function') {
        window.resumeThunderAudio();
      }
    });
    
    theFlopVideo.addEventListener('ended', function() {
      // Resume thunder when video ends
      if (typeof window.resumeThunderAudio === 'function') {
        window.resumeThunderAudio();
      }
    });
  }
});
