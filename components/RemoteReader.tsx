// components/RemoteReader.tsx v1.15.8
"use client";

/**
 * 远程阅读器（编排层）：数据/搜索/书签/划词逻辑在 components/reader/ 下，
 * 本文件只做状态编排与 JSX 组装。行为与拆分前保持一致。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toSimplified } from "@/lib/t2s";
import type { ReaderMatch } from "@/lib/readerSearch";
import ReaderToc from "./ReaderToc";
import ScrollProgress from "./ScrollProgress";
import ReaderToolbar from "./ReaderToolbar";
import ReaderSearchBar from "./ReaderSearchBar";
import ReaderSelectionMenu from "./ReaderSelectionMenu";
import { useReaderData } from "./reader/useReaderData";
import { useReaderNavigation } from "./reader/useReaderNavigation";
import { useReaderSearch } from "./reader/useReaderSearch";
import { useReaderBookmarks } from "./reader/useReaderBookmarks";
import { useReaderSelection } from "./reader/useReaderSelection";
import { downloadBookText } from "./reader/download";
import {
  ReaderLoading,
  ReaderLargeWarning,
  ReaderError,
  ReaderToast,
  ReadPosPanel,
  ReaderHeader,
  ReaderActionRow,
} from "./reader/ReaderPanels";
import { ReaderProgressBar, ReaderBodyText, ReaderPagination } from "./reader/ReaderBody";

export default function RemoteReader({ bookId, initialQuery = "" }: { bookId: string; initialQuery?: string }) {
  const {
    book, content, error, loading, loadingProgress, loadingFromCache, showLargeWarning,
    chapterIdx, setChapterIdx, pageIdx, setPageIdx, usingManifest, toc, chapters,
    loadChapter, loadContent, confirmLargeLoad, setError, setLoading,
  } = useReaderData(bookId);

  // 阅读偏好
  const [simple, setSimple] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);

  // 小屏（<420px）初始字号自适应
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 420) setFontSize(15);
  }, []);

  // 繁简偏好
  useEffect(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("ab-simple");
      if (v) setSimple(v === "1");
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("ab-simple", simple ? "1" : "0");
  }, [simple]);

  // 目录 / 分页 / 翻页导航（拆入 useReaderNavigation 钩子）
  const {
    navItems, currentTitle, paragraphs, totalPages, pageParagraphs,
    goPage, goChapter, onBodyTouchStart, onBodyTouchEnd, matchLabel,
  } = useReaderNavigation({
    usingManifest, chapterIdx, pageIdx, setChapterIdx, setPageIdx,
    toc, chapters, content, book, loadChapter,
  });

  // 页内搜索：分片模式仅当前章节，整本模式为全书
  const searchChapters = useMemo(
    () =>
      usingManifest
        ? [{ title: currentTitle, paragraphs }]
        : chapters.map((c) => ({ title: c.title, paragraphs: c.paragraphs })),
    [usingManifest, currentTitle, paragraphs, chapters]
  );
  const search = useReaderSearch({ initialQuery, searchChapters, simple });

  // 页内搜索：跳转到命中处（分片模式命中只在当前章节，跳页即可）
  const jumpToMatch = useCallback(
    (m: ReaderMatch) => {
      if (!usingManifest) goChapter(m.chapterIdx);
      setPageIdx(m.pageIdx);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [usingManifest, goChapter, setPageIdx]
  );

  const bookmarks = useReaderBookmarks({
    bookId: book?.id ?? "",
    bookTitle: book?.title ?? "",
    bookCategory: book?.category ?? "",
    currentTitle,
    chapterIdx,
    pageIdx,
    goChapter,
    setPageIdx,
  });

  const selection = useReaderSelection(book, currentTitle);

  const handleDownload = useCallback(() => {
    if (book) downloadBookText(book, content, simple, usingManifest);
  }, [book, content, simple, usingManifest]);

  if (loading) return <ReaderLoading fromCache={loadingFromCache} progress={loadingProgress} />;

  if (showLargeWarning && book) return <ReaderLargeWarning book={book} onConfirm={confirmLargeLoad} />;

  if (error) return (
    <ReaderError
      error={error}
      book={book}
      onRetry={() => { setError(null); setLoading(true); if (book) loadContent(book, true); }}
    />
  );

  if (!book || (!content && !usingManifest)) return null;

  return (
    <div className="reader-wrap" id="remote-reader">
      <ScrollProgress />
      <ReaderHeader book={book} chapterCount={navItems.length} usingManifest={usingManifest} />

      <ReaderActionRow
        bookmarked={bookmarks.bookmarked}
        onToggleBookmark={bookmarks.toggleBookmark}
        onSavePos={bookmarks.saveReadPos}
        onTogglePos={() => bookmarks.setShowPos(!bookmarks.showPos)}
        posCount={bookmarks.readPosList.length}
        onToggleSearch={() => search.setShowSearch(!search.showSearch)}
      />

      {search.showSearch && (
        <ReaderSearchBar
          query={search.searchQuery}
          onQuery={search.setSearchQuery}
          onSubmit={search.submit}
          onClose={search.close}
          matches={search.matches}
          onJump={jumpToMatch}
          labelOf={matchLabel}
          submitted={!!search.submittedQuery}
        />
      )}

      {bookmarks.showPos && (
        <ReadPosPanel
          list={bookmarks.readPosList}
          onGoto={bookmarks.gotoReadPos}
          onDelete={bookmarks.deleteReadPos}
          onClose={() => bookmarks.setShowPos(false)}
        />
      )}

      <ReaderToolbar
        fontSize={fontSize}
        lineHeight={lineHeight}
        simple={simple}
        onFontDec={() => setFontSize(Math.max(14, fontSize - 1))}
        onFontInc={() => setFontSize(Math.min(22, fontSize + 1))}
        onLineDec={() => setLineHeight(Math.max(1.5, +(lineHeight - 0.1).toFixed(1)))}
        onLineInc={() => setLineHeight(Math.min(2.4, +(lineHeight + 0.1).toFixed(1)))}
        onToggleSimple={setSimple}
        onDownload={handleDownload}
      />

      <ReaderProgressBar total={navItems.length} current={chapterIdx} onSeek={goChapter} />

      <ReaderToc items={navItems} current={chapterIdx} onSelect={goChapter} disabled={loading} />

      <ReaderBodyText
        title={currentTitle}
        paragraphs={pageParagraphs}
        renderText={search.renderText}
        fontSize={fontSize}
        lineHeight={lineHeight}
        onTouchStart={onBodyTouchStart}
        onTouchEnd={onBodyTouchEnd}
      />

      <ReaderPagination pageIdx={pageIdx} totalPages={totalPages} onPage={goPage} />

      {selection.selBtn && (
        <ReaderSelectionMenu
          sel={selection.selBtn}
          onSearch={selection.searchSelection}
          onCite={selection.copyCitation}
        />
      )}

      {selection.toast && <ReaderToast message={selection.toast} />}
    </div>
  );
}
