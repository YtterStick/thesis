import { useState, useEffect, useRef } from 'react';

export const useScrollSpy = (sectionIds, options = {}) => {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || '');
  const [lastDetectedSection, setLastDetectedSection] = useState(sectionIds[0] || '');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const sectionHistoryRef = useRef([]);
  const scrollRootRef = options.rootRef;

  // Throttle scroll events for better performance
  useEffect(() => {
    const scrollContainer = scrollRootRef?.current || window;

    const handleScroll = () => {
      const currentScrollY = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
      const scrollDirection = currentScrollY > lastScrollYRef.current ? 'down' : 'up';
      lastScrollYRef.current = currentScrollY;

      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set new timeout
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        const rootRect = scrollContainer === window
          ? { top: 0, bottom: window.innerHeight }
          : scrollContainer.getBoundingClientRect();
        const viewportHeight = scrollContainer === window ? window.innerHeight : scrollContainer.clientHeight;
        
        const sections = sectionIds.map(id => {
          const element = document.getElementById(id);
          if (!element) return null;
          
          const rect = element.getBoundingClientRect();
          const elementTop = scrollContainer === window
            ? element.offsetTop
            : rect.top - rootRect.top + scrollContainer.scrollTop;
          const elementBottom = elementTop + element.offsetHeight;
          
          return {
            id,
            element,
            top: rect.top - rootRect.top,
            bottom: rect.bottom - rootRect.top,
            height: rect.height,
            absoluteTop: elementTop,
            absoluteBottom: elementBottom,
            viewportTop: rect.top - rootRect.top,
            viewportBottom: rect.bottom - rootRect.top
          };
        }).filter(Boolean);

        if (sections.length === 0) return;

        const viewportMiddle = viewportHeight / 2;
        const activationLine = viewportHeight * 0.35;
        
        let mostVisibleSection = null;
        let maxVisibility = 0;

        // First pass: find sections with any visibility
        const visibleSections = sections.filter(section => {
          return section.viewportBottom > 0 && section.viewportTop < viewportHeight;
        });

        // If we have visible sections, find the best one
        if (visibleSections.length > 0) {
          visibleSections.forEach(section => {
            // Calculate visible percentage
            const visibleHeight = Math.min(section.viewportBottom, viewportHeight) - Math.max(section.viewportTop, 0);
            const visibilityRatio = visibleHeight / section.height;

            // Calculate distance from viewport center (closer is better)
            const sectionMiddle = (section.viewportTop + section.viewportBottom) / 2;
            const distanceFromMiddle = Math.abs(sectionMiddle - viewportMiddle);
            const centerProximity = Math.max(0, 1 - (distanceFromMiddle / viewportHeight));

            // Combined score - prioritize visibility but consider center proximity
            const totalScore = (visibilityRatio * 0.7) + (centerProximity * 0.3);

            // Lower threshold for detection - any visible section is considered
            const requiredVisibility = section.id === 'service_tracking' ? 0.42 : 0.18;
            const topGate = section.id === 'service_tracking'
              ? section.viewportTop <= viewportHeight * 0.25
              : true;

            if (totalScore > maxVisibility && visibilityRatio > requiredVisibility && topGate) {
              maxVisibility = totalScore;
              mostVisibleSection = section.id;
            }
          });
        }

        let finalActiveSection = activeSection;

        if (mostVisibleSection) {
          // We found a visible section
          finalActiveSection = mostVisibleSection;
          setLastDetectedSection(mostVisibleSection);
          
          // Update section history (keep last 5 sections)
          sectionHistoryRef.current = [
            mostVisibleSection,
            ...sectionHistoryRef.current.filter(s => s !== mostVisibleSection)
          ].slice(0, 5);
        } else {
          // NO SECTION IS VISIBLE - use intelligent fallback based on scroll position
          const currentScrollY = scrollContainer === window ? window.scrollY : scrollContainer.scrollTop;
          
          // Find which section we're closest to in terms of scroll position
          let closestSection = null;
          let minDistance = Infinity;

          sections.forEach(section => {
            // Calculate distance to section's middle point
            const sectionMiddle = section.absoluteTop + (section.height / 2);
            const distance = Math.abs(sectionMiddle - currentScrollY);
            
            if (distance < minDistance) {
              minDistance = distance;
              closestSection = section.id;
            }
          });

          if (closestSection) {
            // Determine if we should use closest section or last detected section
            const closestSectionElement = sections.find(s => s.id === closestSection);
            const lastDetectedSectionElement = sections.find(s => s.id === lastDetectedSection);
            
            if (scrollDirection === 'down') {
              // When scrolling down, prefer last detected section to avoid jumping back
              if (lastDetectedSectionElement && 
                  currentScrollY >= lastDetectedSectionElement.absoluteTop) {
                finalActiveSection = lastDetectedSection;
              } else {
                finalActiveSection = closestSection;
              }
            } else {
              // When scrolling up, prefer last detected section if we haven't passed it
              if (lastDetectedSectionElement && 
                  currentScrollY <= lastDetectedSectionElement.absoluteBottom) {
                finalActiveSection = lastDetectedSection;
              } else {
                finalActiveSection = closestSection;
              }
            }
            
            // Special case: if we're between sections, don't jump to home unnecessarily
            const homeSection = sections.find(s => s.id === 'home');
            const termsSection = sections.find(s => s.id === 'terms');
            const trackingSection = sections.find(s => s.id === 'service_tracking');
            
            if (scrollDirection === 'up' && 
                lastDetectedSection === 'terms' && 
                currentScrollY > trackingSection.absoluteTop && 
                currentScrollY < termsSection.absoluteBottom) {
              // We're scrolling up from terms but still in tracking/terms area
              finalActiveSection = 'terms';
            } else if (scrollDirection === 'up' && 
                      lastDetectedSection === 'terms' && 
                      currentScrollY > trackingSection.absoluteTop - 100 && 
                      currentScrollY < trackingSection.absoluteBottom) {
              // We're near the tracking section while scrolling up from terms
              finalActiveSection = 'service_tracking';
            }
          }
        }

        // Safety check: never jump to home if we were just in terms and scrolling up too close to that section
        if (scrollDirection === 'up' && 
            lastDetectedSection === 'terms' && 
            finalActiveSection === 'home' &&
            currentScrollY > sections.find(s => s.id === 'service_tracking').absoluteTop - 120) {
          finalActiveSection = lastDetectedSection;
        }

        // Only update if the section actually changed
        if (finalActiveSection && finalActiveSection !== activeSection) {
          console.log('Section change:', {
            from: activeSection,
            to: finalActiveSection,
            scrollY: currentScrollY,
            direction: scrollDirection,
            lastDetected: lastDetectedSection
          });
          setActiveSection(finalActiveSection);
        }
      }, options.throttle || 100);
    };

    // Add scroll listener with passive for better performance
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [sectionIds, activeSection, lastDetectedSection, options.throttle, scrollRootRef]);

  return { activeSection, isScrolling };
};