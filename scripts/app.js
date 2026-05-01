const quoteData = [
  { text: "작은 습관이 큰 변화를 만든다.", author: "제임스 클리어" },
  { text: "시작이 반이다. 오늘 한 걸음을 떼어라.", author: "아리스토텔레스" },
  { text: "꾸준함은 재능을 이긴다.", author: "존 맥스웰" },
  { text: "두려움 너머에 성장이 있다.", author: "수전 제퍼스" },
  { text: "실패는 끝이 아니라 다음 시도의 근거다.", author: "토머스 에디슨" },
];

function getRandomQuote(quotes) {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return {
      text: "명언 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      author: "시스템",
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

function initQuoteGenerator() {
  const inputEl = document.querySelector("#keywordInput");
  const nextQuoteBtnEl = document.querySelector("#nextQuoteBtn");
  const copyQuoteBtnEl = document.querySelector("#copyQuoteBtn");
  const shareQuoteBtnEl = document.querySelector("#shareQuoteBtn");
  const shareOptionsEl = document.querySelector("#shareOptions");
  const shareEmailBtnEl = document.querySelector("#shareEmailBtn");
  const shareSnsBtnEl = document.querySelector("#shareSnsBtn");
  const shareUrlBtnEl = document.querySelector("#shareUrlBtn");
  const outputEl = document.querySelector("#quoteOutput");
  const customQuoteTextEl = document.querySelector("#customQuoteText");
  const customQuoteAuthorEl = document.querySelector("#customQuoteAuthor");
  const addCustomQuoteBtnEl = document.querySelector("#addCustomQuoteBtn");
  const quoteCharCountEl = document.querySelector("#quoteCharCount");
  const uiMessageEl = document.querySelector("#uiMessage");

  if (
    !inputEl ||
    !nextQuoteBtnEl ||
    !copyQuoteBtnEl ||
    !shareQuoteBtnEl ||
    !shareOptionsEl ||
    !shareEmailBtnEl ||
    !shareSnsBtnEl ||
    !shareUrlBtnEl ||
    !outputEl ||
    !customQuoteTextEl ||
    !customQuoteAuthorEl ||
    !addCustomQuoteBtnEl ||
    !quoteCharCountEl ||
    !uiMessageEl
  ) {
    return;
  }

  let messageTimer = null;

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

  let currentQuote = getRandomQuote(quoteData);
  renderQuote(currentQuote, outputEl);

  const onGenerate = () => {
    const quote = createQuote(inputEl.value);
    currentQuote = quote;
    renderQuote(quote, outputEl);
  };

  const onCopy = async () => {
    try {
      await copyTextToClipboard(formatQuoteText(currentQuote));
      showMessage("명언이 클립보드에 복사되었습니다.");
    } catch (error) {
      showMessage("복사에 실패했습니다. 다시 시도해주세요.", "error");
    }
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

  const onCustomQuoteInput = () => {
    quoteCharCountEl.textContent = `${customQuoteTextEl.value.length} / 300`;
  };

  const onAddCustomQuote = () => {
    const text = customQuoteTextEl.value.trim();
    const author = customQuoteAuthorEl.value.trim();

    if (text.length === 0) {
      showMessage("명언 내용을 입력해주세요.", "error");
      return;
    }

    if (author.length === 0) {
      showMessage("저자명을 입력해주세요.", "error");
      return;
    }

    const newQuote = { text, author };
    quoteData.push(newQuote);
    currentQuote = newQuote;
    renderQuote(newQuote, outputEl);

    customQuoteTextEl.value = "";
    customQuoteAuthorEl.value = "";
    onCustomQuoteInput();
    showMessage("나만의 명언이 추가되었습니다.");
  };

  nextQuoteBtnEl.addEventListener("click", onGenerate);
  copyQuoteBtnEl.addEventListener("click", onCopy);
  shareQuoteBtnEl.addEventListener("click", onShare);
  shareEmailBtnEl.addEventListener("click", onShareByEmail);
  shareSnsBtnEl.addEventListener("click", onShareBySns);
  shareUrlBtnEl.addEventListener("click", onCopyShareUrl);
  addCustomQuoteBtnEl.addEventListener("click", onAddCustomQuote);
  customQuoteTextEl.addEventListener("input", onCustomQuoteInput);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      onGenerate();
    }
  });
}

document.addEventListener("DOMContentLoaded", initQuoteGenerator);
