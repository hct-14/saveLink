/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  db,
  tryAnonymousAuth,
  loginWithGoogle,
  logoutUser,
  getOrCreateLocalUserId,
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
import { CheckCircle2, AlertCircle, Info, Cloud, CloudOff, LogIn, LogOut, Key } from 'lucide-react';

const LOCAL_STORAGE_CATEGORIES_KEY = 'smart_bookmark_local_categories';
const LOCAL_STORAGE_BOOKMARKS_KEY = 'smart_bookmark_local_bookmarks';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [localUserId] = useState<string>(() => getOrCreateLocalUserId());

  // Data state (with offline/local storage fallback)
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  // Track if we need to sync local changes to localStorage
  const isUsingFirestore = Boolean(user);

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
  const [isAuthHelpOpen, setIsAuthHelpOpen] = useState(false);

  // Global Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync theme
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

  // Always mirror categories & bookmarks to localStorage for instant local backup
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
    } catch {
      // ignore
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch {
      // ignore
    }
  }, [bookmarks]);

  // Seed sample data if empty
  useEffect(() => {
    const hasInitialized = localStorage.getItem('smart_bookmark_initialized_seed');
    if (!hasInitialized && categories.length === 0 && bookmarks.length === 0) {
      localStorage.setItem('smart_bookmark_initialized_seed', 'true');
      const sampleCats = getSampleCategories(localUserId);
      const sampleBms = getSampleBookmarks(localUserId, sampleCats);
      setCategories(sampleCats);
      setBookmarks(sampleBms);
    }
  }, [categories.length, bookmarks.length, localUserId]);

  // 1. Auth Listener & Initial Connection
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    // Try background anonymous auth (if enabled on Firebase Console)
    tryAnonymousAuth()
      .then((anonUser) => {
        if (anonUser) {
          setUser(anonUser);
        }
      })
      .finally(() => {
        setAuthLoading(false);
      });

    return () => unsubscribe();
  }, []);

  // 2. Realtime Firestore Synchronization when user is authenticated
  const hasSyncedInitialData = useRef(false);
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

    let serverCategoriesCount = 0;
    let serverBookmarksCount = 0;

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const loadedCats: Category[] = [];
        snapshot.forEach((docSnap) => {
          loadedCats.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
        serverCategoriesCount = loadedCats.length;
        if (loadedCats.length > 0) {
          setCategories(loadedCats);
        }
      },
      (error) => {
        console.warn('Firestore categories listener:', error);
      }
    );

    const unsubBookmarks = onSnapshot(
      bookmarksQuery,
      (snapshot) => {
        const loadedBms: Bookmark[] = [];
        snapshot.forEach((docSnap) => {
          loadedBms.push({ id: docSnap.id, ...docSnap.data() } as Bookmark);
        });
        serverBookmarksCount = loadedBms.length;
        if (loadedBms.length > 0) {
          setBookmarks(loadedBms);
        }

        // If user logged in and server is empty but local has items, migrate local to server
        if (!hasSyncedInitialData.current) {
          hasSyncedInitialData.current = true;
          if (serverCategoriesCount === 0 && serverBookmarksCount === 0 && categories.length > 0) {
            const batch = writeBatch(db);
            const now = new Date().toISOString();

            categories.forEach((cat) => {
              const catRef = doc(db, 'categories', cat.id);
              batch.set(catRef, { ...cat, userId: user.uid, updatedAt: now });
            });

            bookmarks.forEach((bm) => {
              const bmRef = doc(db, 'bookmarks', bm.id);
              batch.set(bmRef, { ...bm, userId: user.uid, updatedAt: now });
            });

            batch.commit().then(() => {
              showToast('Đã đồng bộ dữ liệu lên Firebase Firestore!', 'success');
            }).catch((err) => {
              console.error('Error migrating to Firestore:', err);
            });
          }
        }
      },
      (error) => {
        console.warn('Firestore bookmarks listener:', error);
      }
    );

    return () => {
      unsubCategories();
      unsubBookmarks();
    };
  }, [user]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      const loggedUser = await loginWithGoogle();
      setUser(loggedUser);
      showToast(`Đăng nhập thành công: ${loggedUser.email || loggedUser.displayName || 'Tài khoản Google'}`);
    } catch (err: unknown) {
      console.error('Google login error:', err);
      showToast(err instanceof Error ? err.message : 'Đăng nhập không thành công', 'error');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      showToast('Đã đăng xuất, quay về chế độ lưu cục bộ', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Bookmark Actions (Resilient: Writes to Firestore if connected, otherwise local state)
  const handleSaveBookmark = async (bookmarkData: Partial<Bookmark>) => {
    const effectiveUserId = user ? user.uid : localUserId;
    const now = new Date().toISOString();

    if (editingBookmark) {
      const updated: Bookmark = {
        ...editingBookmark,
        ...bookmarkData,
        updatedAt: now,
      };

      if (user) {
        try {
          const docRef = doc(db, 'bookmarks', editingBookmark.id);
          await updateDoc(docRef, {
            ...bookmarkData,
            updatedAt: now,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `bookmarks/${editingBookmark.id}`);
        }
      }

      setBookmarks((prev) => prev.map((b) => (b.id === editingBookmark.id ? updated : b)));
      showToast('Đã cập nhật bookmark thành công!');
    } else {
      const newId = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newRecord: Bookmark = {
        id: newId,
        userId: effectiveUserId,
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

      if (user) {
        try {
          const docRef = doc(db, 'bookmarks', newId);
          await setDoc(docRef, newRecord);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `bookmarks/${newId}`);
        }
      }

      setBookmarks((prev) => [newRecord, ...prev]);
      showToast('Đã lưu liên kết mới thành công!');
    }
  };

  const handleToggleFavorite = async (bookmark: Bookmark) => {
    const newFav = !bookmark.isFavorite;
    const now = new Date().toISOString();

    if (user) {
      try {
        const docRef = doc(db, 'bookmarks', bookmark.id);
        await updateDoc(docRef, {
          isFavorite: newFav,
          updatedAt: now,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `bookmarks/${bookmark.id}`);
      }
    }

    setBookmarks((prev) =>
      prev.map((b) => (b.id === bookmark.id ? { ...b, isFavorite: newFav, updatedAt: now } : b))
    );
    showToast(newFav ? 'Đã thêm vào yêu thích' : 'Đã bỏ yêu thích', 'info');
  };

  const handleDeleteBookmark = async (bookmark: Bookmark) => {
    if (!window.confirm(`Bạn có chắc muốn xóa liên kết "${bookmark.title}" không?`)) {
      return;
    }

    if (user) {
      try {
        const docRef = doc(db, 'bookmarks', bookmark.id);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `bookmarks/${bookmark.id}`);
      }
    }

    setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
    showToast('Đã xóa bookmark');
  };

  // Category Actions (Resilient: Never throws "Chưa kết nối phiên làm việc")
  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    const effectiveUserId = user ? user.uid : localUserId;
    const now = new Date().toISOString();

    if (editingCategory) {
      const updatedCat: Category = {
        ...editingCategory,
        ...categoryData,
        updatedAt: now,
      };

      if (user) {
        try {
          const docRef = doc(db, 'categories', editingCategory.id);
          await updateDoc(docRef, {
            ...categoryData,
            updatedAt: now,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `categories/${editingCategory.id}`);
        }
      }

      setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updatedCat : c)));
      showToast('Đã cập nhật thư mục');
    } else {
      const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newCat: Category = {
        id: newId,
        userId: effectiveUserId,
        name: categoryData.name || 'Thư mục mới',
        parentId: categoryData.parentId || null,
        icon: categoryData.icon || 'Folder',
        color: categoryData.color || '#4F46E5',
        order: categories.length + 1,
        createdAt: now,
        updatedAt: now,
      };

      if (user) {
        try {
          const docRef = doc(db, 'categories', newId);
          await setDoc(docRef, newCat);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `categories/${newId}`);
        }
      }

      setCategories((prev) => [...prev, newCat]);
      showToast('Đã tạo thư mục mới!');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    const subcats = categories.filter((c) => c.parentId === category.id);
    const affectedBms = bookmarks.filter((b) => b.categoryId === category.id);

    const confirmMsg = subcats.length > 0 || affectedBms.length > 0
      ? `Thư mục "${category.name}" có ${affectedBms.length} bookmark và ${subcats.length} thư mục con. Bạn có chắc muốn xóa không? (Các bookmark sẽ được chuyển về Chưa phân loại)`
      : `Bạn có chắc muốn xóa thư mục "${category.name}" không?`;

    if (!window.confirm(confirmMsg)) return;

    if (user) {
      try {
        const batch = writeBatch(db);
        affectedBms.forEach((bm) => {
          const bmRef = doc(db, 'bookmarks', bm.id);
          batch.update(bmRef, { categoryId: null, updatedAt: new Date().toISOString() });
        });
        subcats.forEach((sub) => {
          const subRef = doc(db, 'categories', sub.id);
          batch.update(subRef, { parentId: null, updatedAt: new Date().toISOString() });
        });
        const catRef = doc(db, 'categories', category.id);
        batch.delete(catRef);
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `categories/${category.id}`);
      }
    }

    setBookmarks((prev) =>
      prev.map((b) => (b.categoryId === category.id ? { ...b, categoryId: null } : b))
    );
    setCategories((prev) =>
      prev
        .filter((c) => c.id !== category.id)
        .map((c) => (c.parentId === category.id ? { ...c, parentId: null } : c))
    );

    if (selectedCategoryId === category.id) {
      setSelectedCategoryId(null);
    }
    showToast('Đã xóa thư mục');
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
    const effectiveUserId = user ? user.uid : localUserId;
    const now = new Date().toISOString();

    const preparedCategories = newCategories.map((c) => ({
      ...c,
      id: c.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: effectiveUserId,
      createdAt: c.createdAt || now,
      updatedAt: now,
    }));

    const preparedBookmarks = newBookmarks.map((b) => ({
      ...b,
      id: b.id || `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: effectiveUserId,
      createdAt: b.createdAt || now,
      updatedAt: now,
    }));

    if (user) {
      try {
        const batch = writeBatch(db);
        if (mode === 'overwrite') {
          bookmarks.forEach((bm) => batch.delete(doc(db, 'bookmarks', bm.id)));
          categories.forEach((cat) => batch.delete(doc(db, 'categories', cat.id)));
        }
        preparedCategories.forEach((cat) => batch.set(doc(db, 'categories', cat.id), cat));
        preparedBookmarks.forEach((bm) => batch.set(doc(db, 'bookmarks', bm.id), bm));
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'import');
      }
    }

    if (mode === 'overwrite') {
      setCategories(preparedCategories);
      setBookmarks(preparedBookmarks);
    } else {
      setCategories((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        return [...prev, ...preparedCategories.filter((c) => !existingIds.has(c.id))];
      });
      setBookmarks((prev) => {
        const existingIds = new Set(prev.map((b) => b.id));
        return [...prev, ...preparedBookmarks.filter((b) => !existingIds.has(b.id))];
      });
    }

    showToast('Đã khôi phục dữ liệu từ tệp JSON thành công!');
  };

  // Filter & Search computation
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bm) => {
      if (selectedFilter === 'favorites' && !bm.isFavorite) {
        return false;
      }
      if (selectedFilter === 'uncategorized' && bm.categoryId) {
        return false;
      }
      if (selectedFilter === 'all' && selectedCategoryId) {
        const subIds = categories
          .filter((c) => c.parentId === selectedCategoryId)
          .map((c) => c.id);
        const matchCat =
          bm.categoryId === selectedCategoryId ||
          (bm.categoryId && subIds.includes(bm.categoryId));
        if (!matchCat) return false;
      }

      if (selectedTag && (!bm.tags || !bm.tags.includes(selectedTag))) {
        return false;
      }

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

  const activeCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;

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
        isUsingFirestore={isUsingFirestore}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sync Status Banner */}
        <div className="px-4 py-1.5 text-xs bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            {isUsingFirestore ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Đồng bộ Firebase Firestore: {user?.email || 'Phiên trực tuyến'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <CloudOff className="w-3.5 h-3.5 shrink-0" />
                <span>Chế độ lưu cục bộ (Local). Dữ liệu được lưu an toàn trên máy bạn.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUsingFirestore ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:underline"
                title="Đăng xuất"
              >
                <LogOut className="w-3 h-3" />
                <span>Đăng xuất</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGoogleLogin}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs transition-colors"
                  title="Đăng nhập tài khoản Google để đồng bộ lên Firebase Firestore"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Đồng bộ Google</span>
                </button>
                <button
                  onClick={() => setIsAuthHelpOpen(true)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Chi tiết trạng thái kết nối"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

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

      {/* Auth Help Modal */}
      {isAuthHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Trạng thái lưu trữ dữ liệu
              </h3>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
              <p>
                <strong>1. Chế độ hiện tại:</strong> Đang lưu trữ cục bộ (Offline-First) trên trình duyệt của bạn. Bạn có thể thoải mái thêm link, tạo thư mục con, gắn tag, xuất JSON mà không bao giờ bị gián đoạn.
              </p>
              <p>
                <strong>2. Muốn đồng bộ lên đám mây Firestore:</strong> Bạn có thể nhấn nút <strong>"Đồng bộ Google"</strong> ở góc trên bên phải để đăng nhập ngay bằng tài khoản Google. Dữ liệu trên máy sẽ tự động tải lên cơ sở dữ liệu Firebase.
              </p>
              <p>
                <strong>3. Về chế độ Đăng nhập Ẩn danh (Anonymous Auth):</strong> Mặc định trên Firebase Console nhà cung cấp Anonymous đang tắt. Bạn có thể bật tại mục <em>Authentication → Sign-in method → Anonymous → Enable</em> nếu không muốn dùng tài khoản Google.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAuthHelpOpen(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

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
