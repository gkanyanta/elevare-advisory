/* ============================================
   THE ELEVARE ADVISORY — CMS content loader
   Fetches editable content from Sanity and overlays it
   onto the static markup already in the page. If the
   fetch fails for any reason, the hardcoded HTML already
   in each file is left untouched, so the site keeps working.
   ============================================ */

(function () {
  const PROJECT_ID = 'y1dtiw7q';
  const DATASET = 'production';
  const API_VERSION = 'v2024-01-01';

  async function sanityFetch(query) {
    const url = `https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sanity fetch failed: ${res.status}`);
    const json = await res.json();
    return json.result;
  }

  function h(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        el.setAttribute(k, v);
      });
    }
    (children || []).forEach((child) => {
      if (child === undefined || child === null) return;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return el;
  }

  function iconTextChip(className, icon, label) {
    return h('div', { class: className }, [
      h('i', { class: icon || 'fa-solid fa-circle' }, []),
      document.createTextNode(' ' + label),
    ]);
  }

  /* ── Shared: footer, social links, copyright, general email ── */
  function applySiteSettings(settings) {
    if (!settings) return;

    if (settings.footerTagline) {
      document.querySelectorAll('.footer-tagline').forEach((el) => {
        el.textContent = settings.footerTagline;
      });
    }

    if (settings.linkedinUrl) {
      document.querySelectorAll('.social-btn[aria-label="LinkedIn"]').forEach((a) => a.setAttribute('href', settings.linkedinUrl));
    }
    if (settings.twitterUrl) {
      document.querySelectorAll('.social-btn[aria-label="Twitter/X"]').forEach((a) => a.setAttribute('href', settings.twitterUrl));
    }
    if (settings.generalEmail) {
      document.querySelectorAll('.social-btn[aria-label="Email"]').forEach((a) => a.setAttribute('href', 'mailto:' + settings.generalEmail));
      document.querySelectorAll('a[href^="mailto:info@"]').forEach((a) => {
        a.setAttribute('href', 'mailto:' + settings.generalEmail);
        a.textContent = settings.generalEmail;
      });
    }

    if (settings.copyrightText) {
      const copyrightEl = document.querySelector('.footer-bottom span:first-child');
      if (copyrightEl) copyrightEl.textContent = settings.copyrightText;
    }

    if (settings.sectors && settings.sectors.length) {
      document.querySelectorAll('.sectors-row').forEach((row) => {
        // Only the general "sectors we serve" rows, not the About page donor-partners row.
        if (row.closest('.sectors-section')) {
          row.innerHTML = '';
          settings.sectors.forEach((s, i) => {
            row.appendChild(iconTextChip(`sector-chip reveal reveal-delay-${(i % 5) + 1}`, s.icon, s.label));
          });
          window.Elevare.initReveal();
        }
      });
    }
  }

  /* ── Home page ── */
  async function renderHome() {
    const query = `{
      "home": *[_id == "homePage"][0]{
        heroSlides[]{eyebrow, title, description, "imageUrl": image.asset->url},
        stats[]{number, suffix, label},
        establishedYear,
        aboutQuote,
        aboutParagraphs,
        whyUsItems[]{icon, title, description}
      },
      "settings": *[_id == "siteSettings"][0]{footerTagline, generalEmail, linkedinUrl, twitterUrl, copyrightText, sectors[]{icon, label}},
      "services": *[_type == "service"] | order(order asc){title, icon, shortDescription}
    }`;
    const { home, settings, services } = await sanityFetch(query);
    applySiteSettings(settings);
    if (!home) return;

    if (home.heroSlides && home.heroSlides.length) {
      const slideEls = document.querySelectorAll('.slide');
      home.heroSlides.slice(0, slideEls.length).forEach((slide, i) => {
        const el = slideEls[i];
        if (slide.imageUrl) el.style.backgroundImage = `url('${slide.imageUrl}')`;
        const eyebrow = el.querySelector('.slide-eyebrow');
        const title = el.querySelector('.slide-title');
        const desc = el.querySelector('.slide-desc');
        if (eyebrow && slide.eyebrow) eyebrow.textContent = slide.eyebrow;
        if (title && slide.title) title.textContent = slide.title;
        if (desc && slide.description) desc.textContent = slide.description;
      });
    }

    if (home.stats && home.stats.length) {
      const statEls = document.querySelectorAll('.stat');
      home.stats.slice(0, statEls.length).forEach((stat, i) => {
        const numberEl = statEls[i].querySelector('.stat-number');
        const labelEl = statEls[i].querySelector('.stat-label');
        if (numberEl) {
          numberEl.dataset.target = stat.number;
          numberEl.dataset.suffix = stat.suffix || '';
          numberEl.textContent = `0${stat.suffix || ''}`;
        }
        if (labelEl) labelEl.textContent = stat.label;
      });
      window.Elevare.initStatsCounters();
    }

    if (home.establishedYear) {
      const badge = document.querySelector('.about-badge-number');
      if (badge) badge.textContent = home.establishedYear;
    }
    if (home.aboutQuote) {
      const quote = document.querySelector('.about-text blockquote');
      if (quote) quote.textContent = `"${home.aboutQuote}"`;
    }
    if (home.aboutParagraphs && home.aboutParagraphs.length) {
      const paragraphs = document.querySelectorAll('.about-text > p');
      home.aboutParagraphs.slice(0, paragraphs.length).forEach((text, i) => {
        paragraphs[i].textContent = text;
      });
    }

    if (services && services.length) {
      const cards = document.querySelectorAll('.services-section .service-card');
      services.slice(0, cards.length).forEach((service, i) => {
        const card = cards[i];
        const icon = card.querySelector('.service-icon i');
        const title = card.querySelector('h3');
        const desc = card.querySelector('p');
        if (icon && service.icon) icon.className = service.icon;
        if (title) title.textContent = service.title;
        if (desc) desc.textContent = service.shortDescription;
      });
    }

    if (home.whyUsItems && home.whyUsItems.length) {
      const grid = document.querySelector('.why-grid');
      if (grid) {
        grid.innerHTML = '';
        home.whyUsItems.forEach((item, i) => {
          grid.appendChild(
            h('div', { class: `why-card reveal reveal-delay-${(i % 5) + 1}` }, [
              h('div', { class: 'why-icon' }, [h('i', { class: item.icon || 'fa-solid fa-circle' }, [])]),
              h('h4', {}, [item.title]),
              h('p', {}, [item.description]),
            ]),
          );
        });
        window.Elevare.initReveal();
      }
    }
  }

  /* ── About page ── */
  async function renderAbout() {
    const query = `{
      "about": *[_id == "aboutPage"][0]{
        storyParagraphs, missionText, visionText, valuesList,
        donorPartners[]{icon, label}
      },
      "home": *[_id == "homePage"][0]{establishedYear},
      "settings": *[_id == "siteSettings"][0]{footerTagline, generalEmail, linkedinUrl, twitterUrl, copyrightText},
      "team": *[_type == "teamMember"] | order(order asc){name, role, bio, email, "photoUrl": photo.asset->url}
    }`;
    const { about, home, settings, team } = await sanityFetch(query);
    applySiteSettings(settings);

    if (home && home.establishedYear) {
      const badge = document.querySelector('.about-badge-number');
      if (badge) badge.textContent = home.establishedYear;
    }

    if (about) {
      if (about.storyParagraphs && about.storyParagraphs.length) {
        const paragraphs = document.querySelectorAll('.about-text > p');
        about.storyParagraphs.slice(0, paragraphs.length).forEach((text, i) => {
          paragraphs[i].textContent = text;
        });
      }
      const mvvCards = document.querySelectorAll('.mvv-card');
      if (about.missionText && mvvCards[0]) {
        const p = mvvCards[0].querySelector('p');
        if (p) p.textContent = about.missionText;
      }
      if (about.visionText && mvvCards[1]) {
        const p = mvvCards[1].querySelector('p');
        if (p) p.textContent = about.visionText;
      }
      if (about.valuesList && about.valuesList.length && mvvCards[2]) {
        const list = mvvCards[2].querySelector('.mvv-values-list');
        if (list) {
          list.innerHTML = '';
          about.valuesList.forEach((value) => {
            list.appendChild(h('li', {}, [h('i', { class: 'fa-solid fa-check-circle' }, []), document.createTextNode(' ' + value)]));
          });
        }
      }
      if (about.donorPartners && about.donorPartners.length) {
        const row = document.querySelector('.sectors-row');
        if (row) {
          row.innerHTML = '';
          about.donorPartners.forEach((partner) => {
            row.appendChild(iconTextChip('sector-chip reveal', partner.icon, partner.label));
          });
          window.Elevare.initReveal();
        }
      }
    }

    if (team && team.length) {
      const grid = document.querySelector('.team-grid');
      if (grid) {
        grid.innerHTML = '';
        team.forEach((member, i) => {
          grid.appendChild(
            h('div', { class: `team-card reveal reveal-delay-${(i % 5) + 1}` }, [
              h('img', { class: 'team-photo', src: member.photoUrl || '', alt: member.name }, []),
              h('div', { class: 'team-info' }, [
                h('h3', {}, [member.name]),
                h('div', { class: 'team-role' }, [member.role || '']),
                h('p', {}, [member.bio || '']),
                h('p', { style: 'margin-top:0.5rem;font-size:0.85rem;' }, [
                  h('a', { href: `mailto:${member.email}`, style: 'color:var(--gold);' }, [member.email || '']),
                ]),
              ]),
            ]),
          );
        });
        window.Elevare.initReveal();
      }
    }
  }

  /* ── Services page ── */
  async function renderServices() {
    const query = `{
      "services": *[_type == "service"] | order(order asc){title, icon, tag, subDescription, fullDescription, coreAreas},
      "settings": *[_id == "siteSettings"][0]{footerTagline, generalEmail, linkedinUrl, twitterUrl, copyrightText, sectors[]{icon, label}}
    }`;
    const { services, settings } = await sanityFetch(query);
    applySiteSettings(settings);

    if (services && services.length) {
      const grid = document.querySelector('.services-full-grid');
      if (grid) {
        grid.innerHTML = '';
        services.forEach((service) => {
          const body = [
            h('span', { class: 'service-tag' }, [service.tag || '']),
            h('h3', {}, [service.title]),
          ];
          if (service.subDescription) {
            body.push(
              h('p', { style: 'color:var(--gold);font-weight:600;font-size:0.85rem;margin-bottom:0.75rem;' }, [service.subDescription]),
            );
          }
          body.push(h('p', {}, [service.fullDescription || '']));
          if (service.coreAreas && service.coreAreas.length) {
            body.push(
              h('div', { class: 'service-includes' }, [
                h('h5', {}, ['Core Areas']),
                h(
                  'ul',
                  {},
                  service.coreAreas.map((area) => h('li', {}, [area])),
                ),
              ]),
            );
          }
          grid.appendChild(
            h('div', { class: 'service-full reveal' }, [
              h('div', { class: 'service-full-icon' }, [h('i', { class: service.icon || 'fa-solid fa-circle' }, [])]),
              h('div', { class: 'service-full-body' }, body),
            ]),
          );
        });
        window.Elevare.initReveal();
      }
    }
  }

  /* ── Approach page ── */
  async function renderApproach() {
    const query = `{
      "steps": *[_type == "approachStep"] | order(order asc){stepNumber, subtitle, title, paragraphs, deliverables},
      "settings": *[_id == "siteSettings"][0]{footerTagline, generalEmail, linkedinUrl, twitterUrl, copyrightText}
    }`;
    const { steps, settings } = await sanityFetch(query);
    applySiteSettings(settings);

    if (steps && steps.length) {
      const list = document.querySelector('.approach-steps-list');
      if (list) {
        list.innerHTML = '';
        steps.forEach((step) => {
          const body = [
            h('div', { class: 'step-subtitle' }, [step.subtitle || '']),
            h('h3', {}, [step.title]),
            ...(step.paragraphs || []).map((p) => h('p', {}, [p])),
          ];
          if (step.deliverables && step.deliverables.length) {
            body.push(
              h('div', { class: 'step-delivers' }, [
                h('h5', {}, ['Typical Deliverables']),
                h(
                  'ul',
                  {},
                  step.deliverables.map((d) => h('li', {}, [h('i', { class: 'fa-solid fa-circle' }, []), document.createTextNode(' ' + d)])),
                ),
              ]),
            );
          }
          list.appendChild(
            h('div', { class: 'approach-step-full reveal' }, [
              h('div', { class: 'step-num-large' }, [step.stepNumber || '']),
              h('div', { class: 'step-body-full' }, body),
            ]),
          );
        });
        window.Elevare.initReveal();
      }
    }
  }

  /* ── Contact page ── */
  async function renderContact() {
    const query = `{
      "contact": *[_id == "contactPage"][0]{introText, responseTimeText, contactPersons[]{name, email}},
      "faqs": *[_type == "faq"] | order(order asc){question, answer},
      "settings": *[_id == "siteSettings"][0]{footerTagline, generalEmail, linkedinUrl, twitterUrl, copyrightText}
    }`;
    const { contact, faqs, settings } = await sanityFetch(query);
    applySiteSettings(settings);

    if (contact) {
      if (contact.introText) {
        const intro = document.querySelector('.contact-section .reveal-left > p');
        if (intro) intro.textContent = contact.introText;
      }

      const details = document.querySelector('.contact-details');
      if (details) {
        details.innerHTML = '';
        details.appendChild(
          h('div', { class: 'contact-item' }, [
            h('div', { class: 'contact-item-icon' }, [h('i', { class: 'fa-solid fa-envelope' }, [])]),
            h('div', { class: 'contact-item-text' }, [
              h('strong', {}, ['General Enquiries']),
              h('p', {}, [h('a', { href: `mailto:${settings.generalEmail}`, style: 'color:var(--gold);' }, [settings.generalEmail || ''])]),
            ]),
          ]),
        );
        (contact.contactPersons || []).forEach((person) => {
          details.appendChild(
            h('div', { class: 'contact-item' }, [
              h('div', { class: 'contact-item-icon' }, [h('i', { class: 'fa-solid fa-envelope' }, [])]),
              h('div', { class: 'contact-item-text' }, [
                h('strong', {}, [person.name]),
                h('p', {}, [h('a', { href: `mailto:${person.email}`, style: 'color:var(--gold);' }, [person.email || ''])]),
              ]),
            ]),
          );
        });
        details.appendChild(
          h('div', { class: 'contact-item' }, [
            h('div', { class: 'contact-item-icon' }, [h('i', { class: 'fa-brands fa-linkedin-in' }, [])]),
            h('div', { class: 'contact-item-text' }, [h('strong', {}, ['LinkedIn']), h('p', {}, ['The Elevare Advisory'])]),
          ]),
        );
        details.appendChild(
          h('div', { class: 'contact-item' }, [
            h('div', { class: 'contact-item-icon' }, [h('i', { class: 'fa-solid fa-clock' }, [])]),
            h('div', { class: 'contact-item-text' }, [h('strong', {}, ['Response Time']), h('p', {}, [contact.responseTimeText || ''])]),
          ]),
        );
      }
    }

    if (faqs && faqs.length) {
      const list = document.querySelector('.faq-list');
      if (list) {
        list.innerHTML = '';
        faqs.forEach((faq) => {
          list.appendChild(
            h('div', { class: 'faq-item' }, [
              h('button', { class: 'faq-question' }, [document.createTextNode(faq.question + ' '), h('i', { class: 'fa-solid fa-plus' }, [])]),
              h('div', { class: 'faq-answer' }, [faq.answer || '']),
            ]),
          );
        });
        window.Elevare.initFaqAccordion();
      }
    }
  }

  const page = location.pathname.split('/').pop() || 'index.html';
  const renderers = {
    'index.html': renderHome,
    '': renderHome,
    'about.html': renderAbout,
    'services.html': renderServices,
    'approach.html': renderApproach,
    'contact.html': renderContact,
  };
  const render = renderers[page];
  if (render) {
    render().catch((err) => {
      console.error('Elevare CMS content failed to load, showing static fallback content.', err);
    });
  }
})();
