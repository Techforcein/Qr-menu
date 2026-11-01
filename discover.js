(() => {
  const $ = (id) => document.getElementById(id);
  const state = { posts: [], category: "All", query: "" };

  function safeDate(value) {
    const date = new Date((value || "") + "T00:00:00");
    return Number.isNaN(date.getTime())
      ? (value || "Recently")
      : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }

  function makeLink(post, className = "text-link") {
    const link = document.createElement("a");
    link.className = className;
    link.href = post.link || "#";
    link.textContent = (post.linkText || "Explore") + "  →";
    if (/^https?:\/\//i.test(link.href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    return link;
  }

  function makeImage(url, alt) {
    const wrap = document.createElement("div");
    wrap.className = "card-image";
    if (url) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = alt || "Discover story";
      img.loading = "lazy";
      img.onerror = () => { img.remove(); };
      wrap.append(img);
    }
    return wrap;
  }

  function renderFeatured() {
    const host = $("featuredArea");
    host.replaceChildren();
    const featured = state.posts.find(p => p.featured);
    if (!featured) return;
    const card = document.createElement("article");
    card.className = "featured-card";
    const media = document.createElement("div");
    media.className = "featured-image";
    if (featured.image) {
      const img = document.createElement("img");
      img.src = featured.image;
      img.alt = featured.title || "Featured story";
      img.onerror = () => img.remove();
      media.append(img);
    }
    const content = document.createElement("div");
    content.className = "featured-content";
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = featured.tag || "FEATURED";
    const title = document.createElement("h2");
    title.textContent = featured.title || "Featured discovery";
    const desc = document.createElement("p");
    desc.textContent = featured.description || "";
    content.append(tag, title, desc, makeLink(featured));
    card.append(media, content);
    host.append(card);
  }

  function render() {
    const query = state.query.toLowerCase();
    const filtered = state.posts.filter(post => {
      const categoryMatch = state.category === "All" || post.category === state.category;
      const haystack = [post.title, post.description, post.tag, post.category].join(" ").toLowerCase();
      return categoryMatch && haystack.includes(query) && !post.featured;
    });
    const grid = $("feedGrid");
    grid.replaceChildren();
    $("resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "story" : "stories"}`;
    $("emptyState").hidden = filtered.length !== 0;

    filtered.forEach(post => {
      const card = document.createElement("article");
      card.className = "feed-card";
      const media = makeImage(post.image, post.title);
      if (post.tag) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = post.tag;
        media.append(tag);
      }
      const body = document.createElement("div");
      body.className = "card-body";
      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `${post.category || "Discover"}  ·  ${safeDate(post.date)}`;
      const title = document.createElement("h3");
      title.textContent = post.title || "Untitled update";
      const desc = document.createElement("p");
      desc.textContent = post.description || "";
      body.append(meta, title, desc, makeLink(post));
      card.append(media, body);
      grid.append(card);
    });
  }

  async function init() {
    try {
      const response = await fetch("./discover.json?v=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load discover.json (" + response.status + ")");
      const data = await response.json();
      state.posts = Array.isArray(data) ? data : (Array.isArray(data.posts) ? data.posts : []);
      state.posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      renderFeatured();
      render();
    } catch (error) {
      $("feedGrid").textContent = "Discover feed could not load. Check that discover.json is in the same folder as discover.html and contains valid JSON.";
      $("resultCount").textContent = "Feed unavailable";
      console.error(error);
    }
  }

  $("searchInput").addEventListener("input", event => {
    state.query = event.target.value.trim();
    render();
  });

  $("filters").addEventListener("click", event => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button));
    render();
  });

  $("clearFilters").addEventListener("click", () => {
    state.category = "All";
    state.query = "";
    $("searchInput").value = "";
    document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item.dataset.category === "All"));
    render();
  });

  init();
})();