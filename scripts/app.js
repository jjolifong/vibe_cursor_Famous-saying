const quoteData = [
  { text: "작은 습관이 큰 변화를 만든다.", author: "제임스 클리어", authorEn: "James Clear" },
  { text: "시작이 반이다. 오늘 한 걸음을 떼어라.", author: "아리스토텔레스", authorEn: "Aristotle" },
  { text: "꾸준함은 재능을 이긴다.", author: "존 맥스웰", authorEn: "John C. Maxwell" },
  { text: "두려움 너머에 성장이 있다.", author: "수전 제퍼스", authorEn: "Susan Jeffers" },
  { text: "실패는 끝이 아니라 다음 시도의 근거다.", author: "토머스 에디슨", authorEn: "Thomas Edison" },
];

const SAVED_QUOTES_KEY = "famous-saying-saved-quotes";

function getRandomQuote(quotes) {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return {
      text: "명언 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      author: "시스템",
      authorEn: "System",
    };
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

function buildCustomQuote(keyword) {
  const templates = [
    `${keyword}은(는) 오늘의 선택에서 시작된다.`,
    `${keyword}을(를) 반복하면 결국 실력이 된다.`,
    `${keyword} 앞에서 멈추지 않으면 길이 열린다.`,
  ];

  return {
    text: templates[Math.floor(Math.random() * templates.length)],
    author: "키워드 생성",
    authorEn: "",
  };
}

function formatQuoteText(quote) {
  return `${quote.text}\n\n— ${quote.author}`;
}

function isHttpUrl(url) {
  return /^https?:\/\//i.test(url);
}

function renderQuote(quote, outputElement) {
  outputElement.textContent = formatQuoteText(quote);
}

function createQuote(inputValue) {
  const keyword = inputValue.trim();
  if (keyword.length > 0) {
    return buildCustomQuote(keyword);
  }
  return getRandomQuote(quoteData);
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const fallbackTextArea = document.createElement("textarea");
  fallbackTextArea.value = text;
  fallbackTextArea.setAttribute("readonly", "");
  fallbackTextArea.style.position = "fixed";
  fallbackTextArea.style.left = "-9999px";
  document.body.appendChild(fallbackTextArea);
  fallbackTextArea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(fallbackTextArea);

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }

  return true;
}

function loadSavedQuotes() {
  try {
    const raw = localStorage.getItem(SAVED_QUOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedQuotes(items) {
  localStorage.setItem(SAVED_QUOTES_KEY, JSON.stringify(items));
}

function quoteToSerializable(quote) {
  return {
    text: quote.text,
    author: quote.author,
    authorEn: quote.authorEn != null ? quote.authorEn : "",
  };
}

function getSummaryUrl(authorEn) {
  const title = encodeURIComponent(authorEn.trim().replace(/\s+/g, "_"));
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
}

async function fetchAuthorThumbnailUrl(authorEn) {
  const key = typeof authorEn === "string" ? authorEn.trim() : "";
  if (!key) return null;

  const res = await fetch(getSummaryUrl(key), { headers: { Accept: "application/json" } });
  if (!res.ok) return null;

  const data = await res.json();
  const src = data?.thumbnail?.source;
  return typeof src === "string" && src.length > 0 ? src : null;
}

function initQuoteGenerator() {
  const themeToggleBtnEl = document.querySelector("#themeToggleBtn");
  const inputEl = document.querySelector("#keywordInput");
  const nextQuoteBtnEl = document.querySelector("#nextQuoteBtn");
  const saveQuoteBtnEl = document.querySelector("#saveQuoteBtn");
  const shareQuoteBtnEl = document.querySelector("#shareQuoteBtn");
  const shareOptionsEl = document.querySelector("#shareOptions");
  const shareEmailBtnEl = document.querySelector("#shareEmailBtn");
  const shareSnsBtnEl = document.querySelector("#shareSnsBtn");
  const shareUrlBtnEl = document.querySelector("#shareUrlBtn");
  const outputEl = document.querySelector("#quoteOutput");
  const uiMessageEl = document.querySelector("#uiMessage");
  const authorPortraitWrapEl = document.querySelector("#authorPortraitWrap");
  const authorPortraitImgEl = document.querySelector("#authorPortraitImg");
  const savedQuotesListEl = document.querySelector("#savedQuotesList");

  if (
    !themeToggleBtnEl ||
    !inputEl ||
    !nextQuoteBtnEl ||
    !saveQuoteBtnEl ||
    !shareQuoteBtnEl ||
    !shareOptionsEl ||
    !shareEmailBtnEl ||
    !shareSnsBtnEl ||
    !shareUrlBtnEl ||
    !outputEl ||
    !uiMessageEl ||
    !authorPortraitWrapEl ||
    !authorPortraitImgEl ||
    !savedQuotesListEl
  ) {
    return;
  }

  const THEME_KEY = "quote-theme";
  const getInitialTheme = () => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark" || storedTheme === "light") {
      return storedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const applyTheme = (theme) => {
    document.body.setAttribute("data-theme", theme);
    themeToggleBtnEl.textContent = theme === "dark" ? "라이트 테마" : "다크 테마";
  };

  let currentTheme = getInitialTheme();
  applyTheme(currentTheme);

  let messageTimer = null;
  let portraitRequestId = 0;

  const showMessage = (text, type = "success") => {
    if (messageTimer) {
      clearTimeout(messageTimer);
    }

    uiMessageEl.textContent = text;
    uiMessageEl.className = `ui-message is-visible ${
      type === "error" ? "is-error" : "is-success"
    }`;

    messageTimer = setTimeout(() => {
      uiMessageEl.className = "ui-message";
      uiMessageEl.textContent = "";
    }, 2400);
  };

  const setPortraitVisible = (visible) => {
    authorPortraitWrapEl.hidden = !visible;
    if (!visible) {
      authorPortraitImgEl.removeAttribute("src");
      authorPortraitImgEl.alt = "";
    }
  };

  const updateAuthorPortrait = async (quote) => {
    const reqId = ++portraitRequestId;
    setPortraitVisible(false);

    const authorEn = quote?.authorEn;
    if (!authorEn || typeof authorEn !== "string" || !authorEn.trim()) {
      return;
    }

    try {
      const url = await fetchAuthorThumbnailUrl(authorEn);
      if (reqId !== portraitRequestId) return;
      if (!url) {
        setPortraitVisible(false);
        return;
      }
      authorPortraitImgEl.alt = `${quote.author} 사진`;
      authorPortraitImgEl.onload = () => {
        if (reqId !== portraitRequestId) return;
        setPortraitVisible(true);
      };
      authorPortraitImgEl.onerror = () => {
        if (reqId !== portraitRequestId) return;
        setPortraitVisible(false);
      };
      authorPortraitImgEl.src = url;
      if (authorPortraitImgEl.complete && authorPortraitImgEl.naturalWidth > 0) {
        if (reqId === portraitRequestId) setPortraitVisible(true);
      }
    } catch {
      if (reqId !== portraitRequestId) return;
      setPortraitVisible(false);
    }
  };

  const renderSavedList = () => {
    const items = loadSavedQuotes();
    savedQuotesListEl.innerHTML = "";

    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = "saved-quotes-empty";
      empty.textContent = "저장된 명언이 없습니다.";
      savedQuotesListEl.appendChild(empty);
      return;
    }

    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "saved-quote-item";

      const body = document.createElement("div");
      body.className = "saved-quote-body";
      const textEl = document.createElement("p");
      textEl.className = "saved-quote-text";
      textEl.textContent = item.text;
      const metaEl = document.createElement("p");
      metaEl.className = "saved-quote-meta";
      metaEl.textContent = `— ${item.author}`;
      body.appendChild(textEl);
      body.appendChild(metaEl);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "saved-quote-delete";
      delBtn.setAttribute("aria-label", "이 명언 삭제");
      delBtn.textContent = "삭제";

      delBtn.addEventListener("click", () => {
        const next = loadSavedQuotes().filter((_, i) => i !== index);
        persistSavedQuotes(next);
        renderSavedList();
        showMessage("목록에서 삭제했습니다.");
      });

      li.appendChild(body);
      li.appendChild(delBtn);
      savedQuotesListEl.appendChild(li);
    });
  };

  let currentQuote = getRandomQuote(quoteData);
  renderQuote(currentQuote, outputEl);
  void updateAuthorPortrait(currentQuote);
  renderSavedList();

  const onGenerate = () => {
    const quote = createQuote(inputEl.value);
    currentQuote = quote;
    renderQuote(quote, outputEl);
    void updateAuthorPortrait(quote);
  };

  const onSave = () => {
    const items = loadSavedQuotes();
    items.push(quoteToSerializable(currentQuote));
    persistSavedQuotes(items);
    renderSavedList();
    showMessage("명언을 저장했습니다.");
  };

  const onShare = async () => {
    const shareText = formatQuoteText(currentQuote);
    const currentUrl = window.location.href;
    const hasShareableUrl = isHttpUrl(currentUrl);
    const canTryNativeShare =
      hasShareableUrl && typeof navigator.share === "function" && window.isSecureContext;
    const shareCandidates = [
      hasShareableUrl ? { title: "오늘의 명언", text: shareText, url: currentUrl } : null,
      { title: "오늘의 명언", text: shareText },
      hasShareableUrl ? { text: shareText, url: currentUrl } : null,
      { text: shareText },
    ].filter(Boolean);

    if (canTryNativeShare) {
      for (const candidate of shareCandidates) {
        try {
          if (typeof navigator.canShare === "function" && !navigator.canShare(candidate)) {
            continue;
          }
          await navigator.share(candidate);
          shareOptionsEl.classList.remove("is-visible");
          showMessage("공유가 완료되었습니다.");
          return;
        } catch (error) {
          if (error && error.name === "AbortError") {
            showMessage("공유가 취소되었습니다.", "error");
            return;
          }
        }
      }
    }

    shareOptionsEl.classList.add("is-visible");
    showMessage("브라우저 공유가 제한되어 아래 옵션(이메일/SNS/URL 복사)을 표시했습니다.", "error");
  };

  const onShareByEmail = () => {
    const shareText = formatQuoteText(currentQuote);
    const currentUrl = window.location.href;
    const body = isHttpUrl(currentUrl) ? `${shareText}\n\n${currentUrl}` : shareText;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent("오늘의 명언 공유")}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    showMessage("이메일 앱으로 공유를 시도합니다.");
  };

  const onShareBySns = () => {
    const shareText = formatQuoteText(currentQuote);
    const currentUrl = window.location.href;
    const snsUrl = isHttpUrl(currentUrl)
      ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(snsUrl, "_blank", "noopener,noreferrer");
    showMessage("SNS 공유 페이지를 열었습니다.");
  };

  const onCopyShareUrl = async () => {
    const currentUrl = window.location.href;
    const fallbackText = formatQuoteText(currentQuote);
    const valueToCopy = isHttpUrl(currentUrl) ? currentUrl : fallbackText;

    try {
      await copyTextToClipboard(valueToCopy);
      showMessage(
        isHttpUrl(currentUrl)
          ? "URL이 클립보드에 복사되었습니다."
          : "현재 URL 환경 제한으로 명언 텍스트를 복사했습니다."
      );
    } catch (error) {
      showMessage("URL 복사에 실패했습니다. 다시 시도해주세요.", "error");
    }
  };

  const onToggleTheme = () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(currentTheme);
    localStorage.setItem(THEME_KEY, currentTheme);
  };

  nextQuoteBtnEl.addEventListener("click", onGenerate);
  saveQuoteBtnEl.addEventListener("click", onSave);
  shareQuoteBtnEl.addEventListener("click", onShare);
  themeToggleBtnEl.addEventListener("click", onToggleTheme);
  shareEmailBtnEl.addEventListener("click", onShareByEmail);
  shareSnsBtnEl.addEventListener("click", onShareBySns);
  shareUrlBtnEl.addEventListener("click", onCopyShareUrl);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      onGenerate();
    }
  });
}

document.addEventListener("DOMContentLoaded", initQuoteGenerator);
