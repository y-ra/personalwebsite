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

  function openInternalSection(url, project) {
    const sectionId = url.substring(1);
    const returnSection = project && project.getAttribute('data-return-section');
    const returnLabel = project && project.getAttribute('data-return-label');
    if (returnSection) {
      const backBtn = document.querySelector('#' + sectionId + ' .back-category-btn');
      if (backBtn) {
        backBtn.textContent = returnLabel || 'Back';
        backBtn.onclick = function() {
          window.navigateToSection(returnSection);
        };
      }
    }
    if (typeof window.navigateToSection === 'function') {
      window.navigateToSection(sectionId);
    } else {
      window.location.href = url;
    }
  }

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
          openInternalSection(href, this.closest('.project'));
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
        // Anchor links open an in-site page, such as a video
        if (projectUrl.startsWith('#')) {
          openInternalSection(projectUrl, this);
        } else if (projectUrl) {
          // Only open if URL is not empty
          window.open(projectUrl, '_blank');
        }
      }
    });
  });

  // Pause thunder while a portfolio video is playing, and resume when it pauses or ends
  document.querySelectorAll('.content-section video').forEach(function(video) {
    video.addEventListener('play', function() {
      if (typeof window.pauseThunderAudio === 'function') {
        window.pauseThunderAudio();
      }
    });

    video.addEventListener('pause', function() {
      if (typeof window.resumeThunderAudio === 'function') {
        window.resumeThunderAudio();
      }
    });

    video.addEventListener('ended', function() {
      if (typeof window.resumeThunderAudio === 'function') {
        window.resumeThunderAudio();
      }
    });
  });
});
