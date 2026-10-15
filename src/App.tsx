/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  auth,
  db,
  ensureAnonymousAuth,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import { Category, Bookmark, ViewMode, ThemeMode } from './types';
import { getSampleCategories, getSampleBookmarks } from './lib/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BookmarkCard } from './components/BookmarkCard';
import { BookmarkRow } from './components/BookmarkRow';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { CategoryModal } from './components/CategoryModal';
import { ImportExportModal } from './components/ImportExportModal';
import { LocalSetupGuideModal } from './components/LocalSetupGuideModal';
import { EmptyState } from './components/EmptyState';
import { Loader2, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // View & Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'uncategorized'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc'>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('smart_bookmark_view') as ViewMode) || 'grid';
  });

  // Dark / Light Theme
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('smart_bookmark_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Modals state
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryParentId, setCategoryParentId] = useState<string | null>(null);

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('smart_bookmark_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('smart_bookmark_view', mode);
  };

  // 1. Initialize Anonymous Firebase Auth
  useEffect(() => {
    let isMounted = true;
    ensureAnonymousAuth()
      .then((currUser) => {
        if (isMounted) {
          setUser(currUser);
          setAuthLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi khởi tạo Anonymous Auth:', err);
        if (isMounted) {
          setAuthLoading(false);
          showToast('Không thể kết nối phiên lưu trữ trực tuyến', 'error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Realtime listener for Categories & Bookmarks
  useEffect(() => {
    if (!user) return;

    const categoriesQuery = query(
      collection(db, 'categories'),
      where('userId', '==', user.uid)
    );

    const bookmarksQuery = query(
      collection(db, 'bookmarks'),
      where('userId', '==', user.uid)
    );

    let categoriesReady = false;
    let bookmarksReady = false;

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const loadedCats: Category[] = [];
        snapshot.forEach((docSnap) => {
          loadedCats.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        setCategories(loadedCats);
        categoriesReady = true;

        if (categoriesReady && bookmarksReady) {
          setIsDataLoaded(true);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    );

    const unsubBookmarks = onSnapshot(
      bookmarksQuery,
      (snapshot) => {
        const loadedBms: Bookmark[] = [];
        snapshot.forEach((docSnap) => {
          loadedBms.push({ id: docSnap.id, ...docSnap.data() } as Bookmark);
        });
        setBookmarks(loadedBms);
        bookmarksReady = true;

        if (categoriesReady && bookmarksReady) {
          setIsDataLoaded(true);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookmarks');
      }
    );

    return () => {
      unsubCategories();
      unsubBookmarks();
    };
  }, [user]);

  // 3. Seed initial sample data if new user has 0 categories & 0 bookmarks
  useEffect(() => {
    if (!user || !isDataLoaded) return;

    // Check if initial seed has already run for this browser session
    const seedKey = `smart_bookmark_seeded_${user.uid}`;
    if (localStorage.getItem(seedKey)) return;

    if (categories.length === 0 && bookmarks.length === 0) {
      localStorage.setItem(seedKey, 'true');
      const seedInitialData = async () => {
        try {
          const sampleCats = getSampleCategories(user.uid);
          const sampleBms = getSampleBookmarks(user.uid, sampleCats);

          const batch = writeBatch(db);

          sampleCats.forEach((cat) => {
            const catRef = doc(db, 'categories', cat.id);
            batch.set(catRef, cat);
          });

          sampleBms.forEach((bm) => {
            const bmRef = doc(db, 'bookmarks', bm.id);
            batch.set(bmRef, bm);
          });

          await batch.commit();
          showToast('Đã nạp sẵn danh mục và liên kết mẫu!', 'info');
        } catch (err) {
          console.error('Lỗi nạp dữ liệu mẫu ban đầu:', err);
        }
      };

      seedInitialData();
    }
  }, [user, isDataLoaded, categories.length, bookmarks.length]);

  // Bookmark Actions
  const handleSaveBookmark = async (bookmarkData: Partial<Bookmark>) => {
    if (!user) throw new Error('Chưa kết nối phiên làm việc');
    const now = new Date().toISOString();

    if (editingBookmark) {
      // Update
      const docRef = doc(db, 'bookmarks', editingBookmark.id);
      try {
        await updateDoc(docRef, {
          ...bookmarkData,
          updatedAt: now,
        });
        showToast('Đã cập nhật bookmark thành công!');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `bookmarks/${editingBookmark.id}`);
      }
    } else {
      // Create
      const newId = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(db, 'bookmarks', newId);
      const newRecord: Bookmark = {
        id: newId,
        userId: user.uid,
        url: bookmarkData.url || '',
        cleanUrl: bookmarkData.cleanUrl || bookmarkData.url || '',
        title: bookmarkData.title || '',
        description: bookmarkData.description || '',
        favicon: bookmarkData.favicon || '',
        imageUrl: bookmarkData.imageUrl || '',
        categoryId: bookmarkData.categoryId || null,
        tags: bookmarkData.tags || [],
        notes: bookmarkData.notes || '',
        isFavorite: Boolean(bookmarkData.isFavorite),
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(docRef, newRecord);
        showToast('Đã lưu liên kết mới thành công!');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `bookmarks/${newId}`);
      }
    }
  };

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    const docRef = doc(db, 'bookmarks', bookmark.id);
    const newFav = !bookmark.isFavorite;
    try {
      await updateDoc(docRef, {
        isFavorite: newFav,
        updatedAt: new Date().toISOString(),
      });
      showToast(newFav ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `bookmarks/${bookmark.id}`);
    }
  };

  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    if (!window.confirm(`Bạn có chắc muốn xóa liên kết "${bookmark.title}" không?`)) {
      return;
    }
    const docRef = doc(db, 'bookmarks', bookmark.id);
    try {
      await deleteDoc(docRef);
      showToast('Đã xóa bookmark');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bookmarks/${bookmark.id}`);
    }
  };

  // Category Actions
  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    if (!user) throw new Error('Chưa kết nối phiên làm việc');
    const now = new Date().toISOString();

    if (editingCategory) {
      // Update
      const docRef = doc(db, 'categories', editingCategory.id);
      try {
        await updateDoc(docRef, {
          ...categoryData,
          updatedAt: now,
        });
        showToast('Đã cập nhật thư mục');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `categories/${editingCategory.id}`);
      }
    } else {
      // Create
      const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(db, 'categories', newId);
      const newCat: Category = {
        id: newId,
        userId: user.uid,
        name: categoryData.name || 'Thư mục mới',
        parentId: categoryData.parentId || null,
        icon: categoryData.icon || 'Folder',
        color: categoryData.color || '#4F46E5',
        order: categories.length + 1,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(docRef, newCat);
        showToast('Đã tạo thư mục mới!');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `categories/${newId}`);
      }
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    // Check if category has subcategories or bookmarks
    const subcats = categories.filter((c) => c.parentId === category.id);
    const affectedBms = bookmarks.filter((b) => b.categoryId === category.id);

    const confirmMsg = subcats.length > 0 || affectedBms.length > 0
      ? `Thư mục "${category.name}" có ${affectedBms.length} bookmark và ${subcats.length} thư mục con. Bạn có chắc muốn xóa không? (Các bookmark sẽ được chuyển về Chưa phân loại)`
      : `Bạn có chắc muốn xóa thư mục "${category.name}" không?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const batch = writeBatch(db);

      // Unlink affected bookmarks
      affectedBms.forEach((bm) => {
        const bmRef = doc(db, 'bookmarks', bm.id);
        batch.update(bmRef, {
          categoryId: null,
          updatedAt: new Date().toISOString(),
        });
      });

      // Unlink child categories to root
      subcats.forEach((sub) => {
        const subRef = doc(db, 'categories', sub.id);
        batch.update(subRef, {
          parentId: null,
          updatedAt: new Date().toISOString(),
        });
      });

      // Delete the category itself
      const catRef = doc(db, 'categories', category.id);
      batch.delete(catRef);

      await batch.commit();

      if (selectedCategoryId === category.id) {
        setSelectedCategoryId(null);
      }
      showToast('Đã xóa thư mục');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${category.id}`);
    }
  };

  // Import / Export Data Action
  const handleImportData = async ({
    categories: newCategories,
    bookmarks: newBookmarks,
    mode,
  }: {
    categories: Category[];
    bookmarks: Bookmark[];
    mode: 'merge' | 'overwrite';
  }) => {
    if (!user) throw new Error('Chưa kết nối phiên làm việc');

    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      if (mode === 'overwrite') {
        // Delete all current records
        bookmarks.forEach((bm) => {
          batch.delete(doc(db, 'bookmarks', bm.id));
        });
        categories.forEach((cat) => {
          batch.delete(doc(db, 'categories', cat.id));
        });
      }

      // Add new categories
      newCategories.forEach((cat) => {
        const cleanCatId = cat.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        batch.set(doc(db, 'categories', cleanCatId), {
          ...cat,
          id: cleanCatId,
          userId: user.uid,
          updatedAt: now,
          createdAt: cat.createdAt || now,
        });
      });

      // Add new bookmarks
      newBookmarks.forEach((bm) => {
        const cleanBmId = bm.id || `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        batch.set(doc(db, 'bookmarks', cleanBmId), {
          ...bm,
          id: cleanBmId,
          userId: user.uid,
          updatedAt: now,
          createdAt: bm.createdAt || now,
        });
      });

      await batch.commit();
      showToast('Đã khôi phục dữ liệu từ tệp JSON thành công!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'import');
    }
  };

  // Filter & Search computation
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bm) => {
      // 1. Filter by Quick category / favorites
      if (selectedFilter === 'favorites' && !bm.isFavorite) {
        return false;
      }
      if (selectedFilter === 'uncategorized' && bm.categoryId) {
        return false;
      }
      if (selectedFilter === 'all' && selectedCategoryId) {
        // Find subcategories of this category
        const subIds = categories
          .filter((c) => c.parentId === selectedCategoryId)
          .map((c) => c.id);
        const matchCat =
          bm.categoryId === selectedCategoryId ||
          (bm.categoryId && subIds.includes(bm.categoryId));
        if (!matchCat) return false;
      }

      // 2. Filter by Tag
      if (selectedTag && (!bm.tags || !bm.tags.includes(selectedTag))) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = bm.title.toLowerCase().includes(q);
        const inUrl = bm.url.toLowerCase().includes(q);
        const inDesc = bm.description ? bm.description.toLowerCase().includes(q) : false;
        const inNotes = bm.notes ? bm.notes.toLowerCase().includes(q) : false;
        const inTags = bm.tags ? bm.tags.some((t) => t.toLowerCase().includes(q)) : false;

        if (!inTitle && !inUrl && !inDesc && !inNotes && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [bookmarks, selectedFilter, selectedCategoryId, selectedTag, searchQuery, categories]);

  // Sort computation
  const sortedBookmarks = useMemo(() => {
    return [...filteredBookmarks].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title, 'vi');
      }
      return 0;
    });
  }, [filteredBookmarks, sortBy]);

  // Category name for empty state
  const activeCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-sm font-medium">Đang khởi tạo Smart Bookmark...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        categories={categories}
        bookmarks={bookmarks}
        selectedCategoryId={selectedCategoryId}
        selectedFilter={selectedFilter}
        selectedTag={selectedTag}
        theme={theme}
        onSelectCategory={(catId) => {
          setSelectedCategoryId(catId);
          setSelectedFilter('all');
          setSelectedTag(null);
        }}
        onSelectFilter={(filter) => {
          setSelectedFilter(filter);
          setSelectedCategoryId(null);
          setSelectedTag(null);
        }}
        onSelectTag={(tag) => setSelectedTag(tag)}
        onToggleTheme={toggleTheme}
        onOpenAddCategory={(parentId) => {
          setEditingCategory(null);
          setCategoryParentId(parentId || null);
          setIsCategoryModalOpen(true);
        }}
        onOpenEditCategory={(cat) => {
          setEditingCategory(cat);
          setCategoryParentId(cat.parentId || null);
          setIsCategoryModalOpen(true);
        }}
        onDeleteCategory={handleDeleteCategory}
        onOpenAddBookmark={() => {
          setEditingBookmark(null);
          setIsAddBookmarkOpen(true);
        }}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          selectedCategoryId={selectedCategoryId}
          selectedFilter={selectedFilter}
          selectedTag={selectedTag}
          categories={categories}
          totalMatches={sortedBookmarks.length}
          onOpenAddBookmark={() => {
            setEditingBookmark(null);
            setIsAddBookmarkOpen(true);
          }}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Scrollable Bookmarks Grid / List Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {sortedBookmarks.length === 0 ? (
              <EmptyState
                type={
                  searchQuery
                    ? 'no-search-results'
                    : selectedFilter === 'favorites'
                    ? 'no-favorites'
                    : selectedCategoryId
                    ? 'no-category-items'
                    : 'no-bookmarks'
                }
                searchQuery={searchQuery}
                categoryName={activeCategoryName}
                onActionClick={() => {
                  if (searchQuery) setSearchQuery('');
                  else if (selectedFilter === 'favorites') setSelectedFilter('all');
                  else {
                    setEditingBookmark(null);
                    setIsAddBookmarkOpen(true);
                  }
                }}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {sortedBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    categories={categories}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={(bm) => {
                      setEditingBookmark(bm);
                      setIsAddBookmarkOpen(true);
                    }}
                    onDelete={handleDeleteBookmark}
                    onSelectTag={(tag) => setSelectedTag(tag)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sortedBookmarks.map((bookmark) => (
                  <BookmarkRow
                    key={bookmark.id}
                    bookmark={bookmark}
                    categories={categories}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={(bm) => {
                      setEditingBookmark(bm);
                      setIsAddBookmarkOpen(true);
                    }}
                    onDelete={handleDeleteBookmark}
                    onSelectTag={(tag) => setSelectedTag(tag)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Bookmark Modal */}
      <AddBookmarkModal
        isOpen={isAddBookmarkOpen}
        onClose={() => {
          setIsAddBookmarkOpen(false);
          setEditingBookmark(null);
        }}
        onSave={handleSaveBookmark}
        existingBookmarks={bookmarks}
        categories={categories}
        initialBookmark={editingBookmark}
        defaultCategoryId={selectedCategoryId}
      />

      {/* Category Create / Edit Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        categories={categories}
        initialCategory={editingCategory}
        defaultParentId={categoryParentId}
      />

      {/* Backup & Restore (JSON Export / Import) Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        categories={categories}
        bookmarks={bookmarks}
        onImportData={handleImportData}
      />

      {/* Local Setup Instructions Modal */}
      <LocalSetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-medium border border-slate-800 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 dark:text-rose-600" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
