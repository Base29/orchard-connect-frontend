"use client";

import React, { useState, useEffect } from "react";
import NavigationCard from "@/components/NavigationCard";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import RoleBadge from "@/components/RoleBadge";
import NotificationBell from "@/components/NotificationBell";

interface ResidentProfile {
  phase: string;
  block: string;
  house_number: string;
  street_number?: string;
  user_type: string;
  is_verified: boolean;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  rejection_message?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: string;
  resident_profile?: ResidentProfile | null;
  roles?: string[];
}

interface LikeRelation {
  user_id: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
    roles?: string[];
  };
  likes_count: number;
  comments_count: number;
  liked_by_user?: boolean;
  flagged_by_user?: boolean;
  likes?: LikeRelation[];
  flags?: any[];
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
    roles?: string[];
  };
}


interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  contact_whatsapp: string;
  status: string;
  user: {
    name: string;
    resident_profile?: ResidentProfile | null;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  image_url?: string | null;
}

interface PostImage {
  file: File;
  previewUrl: string;
  url?: string;
  status: "uploading" | "success" | "error";
}

// Helper to compute caret coordinates relative to input/textarea offset parent
function getCaretCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number
): { top: number; left: number } {
  const isTextArea = element.nodeName === 'TEXTAREA';
  const div = document.createElement('div');
  document.body.appendChild(div);
  
  const style = div.style;
  const computed = window.getComputedStyle(element);
  
  style.position = 'absolute';
  style.visibility = 'hidden';
  style.whiteSpace = 'pre-wrap';
  if (isTextArea) {
    style.wordBreak = 'break-word';
  }
  
  const properties = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontStretch',
    'fontSize',
    'fontSizeAdjust',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize'
  ];
  
  properties.forEach(prop => {
    // @ts-ignore
    style[prop] = computed[prop];
  });
  
  style.overflowY = 'hidden';
  div.textContent = element.value.substring(0, position);
  
  if (isTextArea) {
    div.style.width = `${element.clientWidth}px`;
  } else {
    div.style.width = `${element.clientWidth}px`;
    div.style.whiteSpace = 'nowrap';
  }
  
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);
  
  const top = element.offsetTop + span.offsetTop - element.scrollTop;
  const left = element.offsetLeft + span.offsetLeft - element.scrollLeft;
  
  document.body.removeChild(div);
  
  return { top, left };
}

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  // File Upload Reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Core data states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = React.useRef<User | null>(null);
  currentUserRef.current = currentUser;

  const commentSubmittingRef = React.useRef<Record<string, boolean>>({});
  const postSubmittingRef = React.useRef(false);

  const [posts, setPosts] = useState<Post[]>([]);

  // Post Draft Images & Lightbox
  const [selectedImages, setSelectedImages] = useState<PostImage[]>([]);
  const [activeLightbox, setActiveLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Page interaction states
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Mentions states
  const [mentionResults, setMentionResults] = useState<{ id: string; name: string; avatar_url?: string; resident_profile?: { phase: string; block: string } | null }[]>([]);
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState("");
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [mentionTargetInput, setMentionTargetInput] = useState<'post' | { type: 'comment'; postId: string } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  // Mentions custom mapping states to mask UUIDs from inputs
  const [selectedMentions, setSelectedMentions] = useState<{ id: string; name: string }[]>([]);
  const [commentMentions, setCommentMentions] = useState<Record<string, { id: string; name: string }[]>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Close mentions dropdown when clicking outside of inputs or dropdown
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mention-dropdown') && !target.closest('textarea') && !target.closest('input')) {
        setMentionActive(false);
        setMentionTargetInput(null);
      }
    };
    
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  // Fetch residents for mentions search
  useEffect(() => {
    if (!mentionActive || mentionSearchQuery === undefined) {
      setMentionResults([]);
      return;
    }

    console.log("Mentions trigger query:", mentionSearchQuery);

    const fetchMentions = async () => {
      try {
        const res = await apiRequest(`/api/residents/search-mentions?query=${encodeURIComponent(mentionSearchQuery)}`);
        console.log("Mentions search response status:", res.status);
        if (res.ok) {
          let data = await res.json();
          console.log("Mentions search results received:", data);
          
          // Prepend @all special mention if query matches prefix of "all"
          const matchesAll = "all".startsWith(mentionSearchQuery.toLowerCase());
          if (matchesAll) {
            data = [{ id: "all", name: "all" }, ...data];
          }
          
          setMentionResults(data);
        } else {
          console.error("Mentions search failed status:", res.status);
        }
      } catch (err) {
        console.error("Error searching mentions:", err);
      }
    };

    if (mentionSearchQuery === "") {
      fetchMentions();
      return;
    }

    const delayDebounceFn = setTimeout(fetchMentions, 150);

    return () => clearTimeout(delayDebounceFn);
  }, [mentionSearchQuery, mentionActive]);

  // Handle text typing inside inputs/textareas to check for '@' mentions
  const handleInputChange = (
    value: string,
    selectionStart: number,
    target: 'post' | { type: 'comment'; postId: string },
    element?: HTMLTextAreaElement | HTMLInputElement
  ) => {
    const textBeforeCursor = value.substring(0, selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    console.log("Mention input check:", {
      value,
      selectionStart,
      textBeforeCursor,
      lastAtIndex
    });

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      console.log("Mention char check:", {
        charBeforeAt,
        textAfterAt,
        isDoubleSpaceOrNewline: /\s\s|\n/.test(textAfterAt),
        isInvalidPrefix: (charBeforeAt !== ' ' && charBeforeAt !== '\n')
      });

      // Cancel if query has a newline, multiple spaces, or not preceded by a space/newline
      if (/\s\s|\n/.test(textAfterAt) || (charBeforeAt !== ' ' && charBeforeAt !== '\n')) {
        setMentionActive(false);
        setMentionTargetInput(null);
        return;
      }

      setMentionActive(true);
      setMentionSearchQuery(textAfterAt);
      setMentionTriggerIndex(lastAtIndex);
      setMentionTargetInput(target);
      setMentionIndex(0);

      if (element) {
        const coords = getCaretCoordinates(element, lastAtIndex);
        setDropdownPosition(coords);
      }
    } else {
      setMentionActive(false);
      setMentionTargetInput(null);
    }
  };

  const selectMention = (resident: { id: string; name: string }) => {
    if (!mentionTargetInput) return;

    // Display only friendly @Name in the input text box
    const mentionText = `@${resident.name} `;

    if (mentionTargetInput === 'post') {
      const value = newPostContent;
      const before = value.substring(0, mentionTriggerIndex);
      const after = value.substring(mentionTriggerIndex + mentionSearchQuery.length + 1);
      const newValue = before + mentionText + after;
      setNewPostContent(newValue);

      // Track selected mention metadata
      setSelectedMentions(prev => {
        if (prev.some(m => m.id === resident.id)) return prev;
        return [...prev, resident];
      });
    } else if (mentionTargetInput.type === 'comment') {
      const postId = mentionTargetInput.postId;
      const value = commentInputs[postId] || "";
      const before = value.substring(0, mentionTriggerIndex);
      const after = value.substring(mentionTriggerIndex + mentionSearchQuery.length + 1);
      const newValue = before + mentionText + after;
      setCommentInputs(prev => ({ ...prev, [postId]: newValue }));

      // Track selected mention metadata for comments
      setCommentMentions(prev => {
        const list = prev[postId] || [];
        if (list.some(m => m.id === resident.id)) return prev;
        return {
          ...prev,
          [postId]: [...list, resident]
        };
      });
    }

    setMentionActive(false);
    setMentionTargetInput(null);
    setMentionResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!mentionActive || mentionResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex(prev => (prev + 1) % mentionResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      selectMention(mentionResults[mentionIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionActive(false);
      setMentionTargetInput(null);
    }
  };

  // Comments states
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});

  // Flagging states
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flaggingPostId, setFlaggingPostId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("spam");
  const [flagComment, setFlagComment] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  // Infinite scroll states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);

  const observerTarget = React.useRef<HTMLDivElement>(null);


  // Micro-toast notifications state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "info"
  });

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4500);
  };

  // 1. Initial Data Fetching from Laravel Container (Optimized with Promise.all)
  const fetchData = async () => {
    try {
      const userRes = await apiRequest("/api/user");
      if (!userRes.ok) {
        router.push("/auth/login");
        return;
      }
      
      const userData = await userRes.json();
      setCurrentUser(userData.user);
      setIsLocked(userData.is_locked);

      // Redirect if no residency record is filled yet
      if (!userData.user?.resident_profile) {
        router.push("/auth/complete-profile");
        return;
      }

      // Fetch posts from feed API
      const postsRes = await apiRequest("/api/posts");
      const postsData = postsRes.ok ? await postsRes.json() : null;

      if (postsData) {
        const mappedPosts = (postsData.data || []).map((post: any) => ({
          ...post,
          liked_by_user: post.likes ? post.likes.some((like: any) => like.user_id === userData.user.id) : false,
          flagged_by_user: post.flags ? post.flags.some((flag: any) => flag.user_id === userData.user.id) : false
        }));
        setPosts(mappedPosts);
        setCurrentPage(postsData.current_page || 1);
        setNextPageUrl(postsData.next_page_url || null);
        setHasMore(!!postsData.next_page_url);
      }

    } catch (err) {
      console.error("Dashboard fetching error:", err);
      showToast("Error connecting to server. Retrying...", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Laravel Reverb WebSocket integration
  useEffect(() => {
    if (!currentUser) return;

    const echo = getEcho();
    if (!echo) return;

    // Join target user's strict private channel
    const channelName = `user.${currentUser.id}`;
    
    echo.private(channelName)
      .listen(".ResidentVerificationStatusUpdated", (data: { status: "pending" | "approved" | "rejected"; rejection_reason?: string; rejection_message?: string }) => {
        console.log("WebSocket Reverb update received:", data);
        
        // Show minimalist toast notification
        if (data.status === "approved") {
          showToast("🎉 Congratulations! Your residency profile has been verified and approved!", "success");
        } else if (data.status === "rejected") {
          const reasonText = data.rejection_reason ? `Reason: ${data.rejection_reason.replace(/_/g, " ")}` : "Please review details.";
          showToast(`⚠️ Residency verification rejected. ${reasonText}`, "error");
        }

        // Refetch data to instantly activate UI features
        fetchData();
      });

    // Subscribe to feed private channel
    echo.private('feed')
      .listen('.PostLiked', (data: { post_id: string; likes_count: number; user_id: string; liked: boolean }) => {
        console.log("Real-time PostLiked received:", data);
        if (data.user_id === currentUserRef.current?.id) return;

        setPosts(prev => prev.map(post => {
          if (post.id === data.post_id) {
            return {
              ...post,
              likes_count: data.likes_count
            };
          }
          return post;
        }));
      })
      .listen('.CommentCreated', (data: { comment: Comment }) => {
        console.log("Real-time CommentCreated received:", data);
        const { comment } = data;
        
        if (comment.user_id === currentUserRef.current?.id) return;
        
        // If comments are loaded/expanded for this post, add the comment
        setComments(prev => {
          if (prev[comment.post_id]) {
            // Avoid duplicate additions
            const exists = prev[comment.post_id].some(c => c.id === comment.id);
            if (!exists) {
              return {
                ...prev,
                [comment.post_id]: [...prev[comment.post_id], comment]
              };
            }
          }
          return prev;
        });

        // Increment comments count on the post
        setPosts(prev => prev.map(post => {
          if (post.id === comment.post_id) {
            return {
              ...post,
              comments_count: post.comments_count + 1
            };
          }
          return post;
        }));
      });

    // Cleanup channel connection on unmount
    return () => {
      echo.leave(channelName);
      echo.leave('feed');
    };
  }, [currentUser]);

  // Scroll and focus on posts/comments based on URL query params or hash
  useEffect(() => {
    if (posts.length === 0) return;

    let targetPostId = searchParams.get("post");
    const targetCommentId = searchParams.get("comment");

    // Fallback to parsing hash if search parameters are empty (for pre-existing notifications)
    if (!targetPostId && typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash;
      if (hash.startsWith("#post-")) {
        targetPostId = hash.substring(6);
      }
    }

    if (targetPostId) {
      if (targetCommentId) {
        // Expand comments if not already expanded
        if (!expandedComments[targetPostId]) {
          setExpandedComments(prev => ({ ...prev, [targetPostId]: true }));
          fetchComments(targetPostId);
          return;
        }

        // Scroll to target comment once comments are loaded
        if (comments[targetPostId]) {
          const scrollToComment = (retries = 5) => {
            const commentElement = document.getElementById(`comment-${targetCommentId}`);
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
              const innerBox = commentElement.querySelector('.flex-1');
              if (innerBox) {
                innerBox.classList.add("border-2", "border-emerald-500", "dark:border-emerald-500");
                innerBox.classList.remove("bg-slate-50", "dark:bg-zinc-800");
                setTimeout(() => {
                  innerBox.classList.remove("border-2", "border-emerald-500", "dark:border-emerald-500");
                  innerBox.classList.add("bg-slate-50", "dark:bg-zinc-800");
                }, 4000);
              }
            } else if (retries > 0) {
              setTimeout(() => scrollToComment(retries - 1), 100);
            }
          };
          scrollToComment();
        }
      } else {
        // Scroll to post smoothly and highlight with a prominent border
        setTimeout(() => {
          const postElement = document.getElementById(`post-${targetPostId}`);
          if (postElement) {
            postElement.scrollIntoView({ behavior: "smooth", block: "center" });
            postElement.classList.add("border-2", "border-emerald-500", "dark:border-emerald-500");
            postElement.classList.remove("border", "border-neutral-200/60", "dark:border-zinc-800/80");
            setTimeout(() => {
              postElement.classList.remove("border-2", "border-emerald-500", "dark:border-emerald-500");
              postElement.classList.add("border", "border-neutral-200/60", "dark:border-zinc-800/80");
            }, 3000);
          }
        }, 500);
      }
    }
  }, [posts, comments, expandedComments, searchParams]);

  // Listen to manual scroll-to-target events from notification bell clicks on the same page
  useEffect(() => {
    const handleScrollEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const targetUrl = customEvent.detail?.targetUrl;
      if (!targetUrl) return;

      const url = new URL(targetUrl, window.location.origin);
      let targetPostId = url.searchParams.get("post");
      const targetCommentId = url.searchParams.get("comment");

      // Support hash url parsing for pre-existing notification redirects
      if (!targetPostId && url.hash && url.hash.startsWith("#post-")) {
        targetPostId = url.hash.substring(6);
      }

      if (targetPostId) {
        if (targetCommentId) {
          if (expandedComments[targetPostId] && comments[targetPostId]) {
            const scrollToComment = (retries = 5) => {
              const commentElement = document.getElementById(`comment-${targetCommentId}`);
              if (commentElement) {
                commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
                const innerBox = commentElement.querySelector('.flex-1');
                if (innerBox) {
                  innerBox.classList.add("border-2", "border-emerald-500", "dark:border-emerald-500");
                  innerBox.classList.remove("bg-slate-50", "dark:bg-zinc-800");
                  setTimeout(() => {
                    innerBox.classList.remove("border-2", "border-emerald-500", "dark:border-emerald-500");
                    innerBox.classList.add("bg-slate-50", "dark:bg-zinc-800");
                  }, 4000);
                }
              } else if (retries > 0) {
                setTimeout(() => scrollToComment(retries - 1), 100);
              }
            };
            scrollToComment();
          } else {
            setExpandedComments(prev => ({ ...prev, [targetPostId]: true }));
            fetchComments(targetPostId);
          }
        } else {
          const postElement = document.getElementById(`post-${targetPostId}`);
          if (postElement) {
            postElement.scrollIntoView({ behavior: "smooth", block: "center" });
            postElement.classList.add("border-2", "border-emerald-500", "dark:border-emerald-500");
            postElement.classList.remove("border", "border-neutral-200/60", "dark:border-zinc-800/80");
            setTimeout(() => {
              postElement.classList.remove("border-2", "border-emerald-500", "dark:border-emerald-500");
              postElement.classList.add("border", "border-neutral-200/60", "dark:border-zinc-800/80");
            }, 3000);
          }
        }
      }
    };

    window.addEventListener("scroll-to-target", handleScrollEvent);
    return () => window.removeEventListener("scroll-to-target", handleScrollEvent);
  }, [posts, comments, expandedComments]);

  // Image Upload Handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedImages.length + files.length > 3) {
      showToast("You can only upload a maximum of 3 images per post.", "error");
      return;
    }

    const newImages = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      status: "uploading" as const,
    }));

    setSelectedImages(prev => [...prev, ...newImages]);

    // Upload each file concurrently
    newImages.forEach(async (img) => {
      try {
        const formData = new FormData();
        formData.append("file", img.file);
        formData.append("type", "post");

        const res = await apiRequest("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setSelectedImages(prev => prev.map(p => p.previewUrl === img.previewUrl ? { ...p, status: "success", url: data.url } : p));
        } else {
          setSelectedImages(prev => prev.map(p => p.previewUrl === img.previewUrl ? { ...p, status: "error" } : p));
          showToast("Failed to upload image. Max file size: 5MB.", "error");
        }
      } catch (err) {
        setSelectedImages(prev => prev.map(p => p.previewUrl === img.previewUrl ? { ...p, status: "error" } : p));
        showToast("Network error uploading image.", "error");
      }
    });

    // Reset input value so the user can select the same file again if they delete it
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (previewUrl: string) => {
    setSelectedImages(prev => {
      const target = prev.find(p => p.previewUrl === previewUrl);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(p => p.previewUrl !== previewUrl);
    });
  };

  // Interaction: Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || isVerified() === false) return;
    
    // Validate if any image is currently uploading
    if (selectedImages.some(img => img.status === "uploading")) {
      showToast("Please wait for all images to complete uploading.", "info");
      return;
    }

    if (postSubmittingRef.current) return;

    postSubmittingRef.current = true;
    setPostSubmitting(true);
    try {
      const uploadedUrls = selectedImages
        .filter(img => img.status === "success" && img.url)
        .map(img => img.url);

      // Preprocess text content to replace masked mentions with backend markdown syntax
      let processedContent = newPostContent.trim();
      
      // Replace @all
      processedContent = processedContent.replace(/\b@all\b/g, '@[all](user:all)');

      // Filter to only those mentions currently inside the text
      const activeMentions = selectedMentions.filter(m => processedContent.includes(`@${m.name}`));
      const sortedMentions = [...activeMentions].sort((a, b) => b.name.length - a.name.length);
      sortedMentions.forEach(mention => {
        const escapedName = mention.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`@${escapedName}\\b`, 'g');
        processedContent = processedContent.replace(regex, `@[${mention.name}](user:${mention.id})`);
      });

      const response = await apiRequest("/api/posts", {
        method: "POST",
        body: JSON.stringify({ 
          content: processedContent,
          media_urls: uploadedUrls,
        }),
      });

      if (response.ok) {
        const newPost = await response.json();
        // Insert new post to top of timeline
        setPosts(prev => [newPost, ...prev]);
        setNewPostContent("");
        setSelectedMentions([]); // Clear post mentions state
        
        // Revoke all preview URLs and reset selected images
        selectedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setSelectedImages([]);
        
        showToast("Post shared successfully!", "success");
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to submit post.", "error");
      }
    } catch (err) {
      showToast("Network error publishing post.", "error");
    } finally {
      postSubmittingRef.current = false;
      setPostSubmitting(false);
    }
  };

  // Load the next page of posts
  const fetchMorePosts = async () => {
    if (loadingMore || !nextPageUrl || !currentUser) return;

    setLoadingMore(true);
    try {
      let relativeEndpoint = nextPageUrl;
      if (nextPageUrl.startsWith("http://") || nextPageUrl.startsWith("https://")) {
        const url = new URL(nextPageUrl);
        relativeEndpoint = url.pathname + url.search;
      }

      const res = await apiRequest(relativeEndpoint);
      if (res.ok) {
        const postsData = await res.json();
        const mappedMorePosts = (postsData.data || []).map((post: any) => ({
          ...post,
          liked_by_user: post.likes ? post.likes.some((like: any) => like.user_id === currentUser.id) : false,
          flagged_by_user: post.flags ? post.flags.some((flag: any) => flag.user_id === currentUser.id) : false
        }));
        
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = mappedMorePosts.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });

        setCurrentPage(postsData.current_page);
        setNextPageUrl(postsData.next_page_url);
        setHasMore(!!postsData.next_page_url);
      }
    } catch (err) {
      console.error("Error fetching more posts:", err);
      showToast("Error loading more posts.", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll observer setup
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, nextPageUrl, loadingMore, currentUser]);

  // Fetch comments of a post
  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await apiRequest(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data }));
      } else {
        showToast("Failed to load comments.", "error");
      }
    } catch (err) {
      showToast("Error loading comments.", "error");
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle comments expand/collapse
  const toggleComments = (postId: string) => {
    const isExpanded = !expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanded }));
    if (isExpanded && !comments[postId]) {
      fetchComments(postId);
    }
  };

  // Interaction: Write Comment
  const handleCreateComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = commentInputs[postId]?.trim();
    if (!content || isVerified() === false) return;
    if (commentSubmittingRef.current[postId]) return;

    commentSubmittingRef.current[postId] = true;
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      // Preprocess text content to replace masked mentions with backend markdown syntax
      let processedContent = content;

      // Replace @all
      processedContent = processedContent.replace(/\b@all\b/g, '@[all](user:all)');

      // Filter to only those mentions currently inside the comment text
      const activeMentions = (commentMentions[postId] || []).filter(m => processedContent.includes(`@${m.name}`));
      const sortedMentions = [...activeMentions].sort((a, b) => b.name.length - a.name.length);
      sortedMentions.forEach(mention => {
        const escapedName = mention.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`@${escapedName}\\b`, 'g');
        processedContent = processedContent.replace(regex, `@[${mention.name}](user:${mention.id})`);
      });

      const response = await apiRequest(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: processedContent }),
      });

      if (response.ok) {
        const newComment = await response.json();
        // Append comment locally (with duplicate check)
        setComments(prev => {
          const list = prev[postId] || [];
          const exists = list.some(c => c.id === newComment.id);
          if (exists) return prev;
          return {
            ...prev,
            [postId]: [...list, newComment]
          };
        });
        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        setCommentMentions(prev => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
        
        // Increment comments count locally
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments_count: post.comments_count + 1
            };
          }
          return post;
        }));
        
        showToast("Comment posted!", "success");
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to post comment.", "error");
      }
    } catch (err) {
      showToast("Error publishing comment.", "error");
    } finally {
      commentSubmittingRef.current[postId] = false;
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };


  // Interaction: Like Post (with Optimistic UI Update)
  const handleToggleLike = async (postId: string) => {
    if (isVerified() === false) {
      showToast("Verification required to interact with posts.", "error");
      return;
    }

    // Find the post to toggle
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return;

    const originalLiked = targetPost.liked_by_user;
    const originalLikesCount = targetPost.likes_count;

    // Optimistically update the UI
    const nextLiked = !originalLiked;
    const nextLikesCount = nextLiked ? originalLikesCount + 1 : Math.max(0, originalLikesCount - 1);

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked_by_user: nextLiked,
          likes_count: nextLikesCount
        };
      }
      return post;
    }));

    try {
      const response = await apiRequest(`/api/posts/${postId}/like`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Sync with official response from server
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked_by_user: data.liked,
              likes_count: data.likes_count,
            };
          }
          return post;
        }));
      } else {
        // Revert to original state on server error
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked_by_user: originalLiked,
              likes_count: originalLikesCount,
            };
          }
          return post;
        }));
        showToast("Failed to update like. Please try again.", "error");
      }
    } catch (err) {
      // Revert to original state on network error
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            liked_by_user: originalLiked,
            likes_count: originalLikesCount,
          };
        }
        return post;
      }));
      showToast("Network error. Could not update like.", "error");
    }
  };

  const handleOpenFlagModal = (postId: string) => {
    if (isVerified() === false) {
      showToast("Verification required to flag posts.", "error");
      return;
    }
    setFlaggingPostId(postId);
    setFlagReason("spam");
    setFlagComment("");
    setIsFlagModalOpen(true);
  };

  const handleCloseFlagModal = () => {
    setIsFlagModalOpen(false);
    setFlaggingPostId(null);
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggingPostId || isVerified() === false) return;

    setFlagSubmitting(true);
    try {
      const response = await apiRequest(`/api/posts/${flaggingPostId}/flag`, {
        method: "POST",
        body: JSON.stringify({
          reason: flagReason,
          comment: flagComment.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "flagged") {
          // Remove the post from the feed since it's now hidden
          setPosts(prev => prev.filter(p => p.id !== flaggingPostId));
          showToast("Thank you. The post has been hidden for moderator review.", "success");
        } else {
          // Update the local flagging state
          setPosts(prev => prev.map(p => {
            if (p.id === flaggingPostId) {
              return {
                ...p,
                flagged_by_user: true,
              };
            }
            return p;
          }));
          showToast("Post reported successfully.", "success");
        }
        
        handleCloseFlagModal();
      } else {
        const errData = await response.json();
        showToast(errData.message || "Failed to submit flag.", "error");
      }
    } catch (err) {
      showToast("Network error submitting report.", "error");
    } finally {
      setFlagSubmitting(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/");
  };

  const isVerified = (): boolean => {
    return currentUser?.resident_profile?.is_verified === true || currentUser?.resident_profile?.status === "approved";
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatRejectionReason = (reason?: string) => {
    if (!reason) return "";
    return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-light text-slate-400 dark:text-zinc-500">Syncing community assets...</p>
      </div>
    );
  }

  const profile = currentUser.resident_profile;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Floating Micro-Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-xs font-semibold max-w-sm animate-slide-in ${
          toast.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-250/30" 
            : toast.type === "error"
            ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border-rose-250/30"
            : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-neutral-100 border-neutral-200/60 dark:border-zinc-800/80"
        }`}>
          <span>
            {toast.type === "success" && "✅"}
            {toast.type === "error" && "❌"}
            {toast.type === "info" && "ℹ️"}
          </span>
          <div className="flex-1">{toast.message}</div>
        </div>
      )}

      {/* Global verification status banners */}
      {!isVerified() && profile && (
        <div className={`w-full py-3.5 px-6 border-b text-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
          profile.status === "rejected" 
            ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-sm">
              {profile.status === "rejected" ? "⚠️" : "🔒"}
            </span>
            <p className="font-light">
              {profile.status === "rejected" ? (
                <>
                  <strong>Residency Profile Rejected</strong> (Reason: {formatRejectionReason(profile.rejection_reason)}). 
                  {profile.rejection_message && <span className="italic"> "{profile.rejection_message}"</span>}
                </>
              ) : (
                <>
                  <strong>Read-Only Guest State</strong> — Your proof documents are pending review. Interactions are restricted.
                </>
              )}
            </p>
          </div>
          {profile.status === "rejected" && (
            <button 
              onClick={() => router.push("/auth/complete-profile")}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 dark:bg-amber-650 dark:hover:bg-amber-700 text-white font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              Update & Resubmit
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-100 dark:border-zinc-900 bg-white/80 dark:bg-black/80 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Orchard Connect
            </span>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/30">
              Community Feed
            </span>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell currentUser={currentUser} />

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme color"
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-all border border-transparent hover:border-neutral-200/50 dark:hover:border-zinc-800"
            >
              {theme === "light" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-neutral-200 dark:border-zinc-800">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold text-sm">
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold">{currentUser.name}</div>
                {profile && (
                  <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                    {profile.phase} • {profile.block}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <NavigationCard currentUser={currentUser} activeKey="feed" variant="desktop" />
        </aside>

        {/* Center Timeline */}
        <main className="lg:col-span-9 space-y-6 order-1 lg:order-2">
          
          {/* Header Row */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Community Feed</h1>
            <p className="text-xs font-light text-slate-400 dark:text-zinc-400">
              Connect, share, and discuss events with fellow Bahria Orchard residents.
            </p>
          </div>

          <NavigationCard currentUser={currentUser} activeKey="feed" variant="mobile" />
          
          {/* Create Post Form */}
          <form onSubmit={handleCreatePost} className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-5 space-y-4 shadow-sm relative">
            
            {/* Read-Only overlay mask */}
            {!isVerified() && (
              <div className="absolute inset-0 bg-white/40 dark:bg-zinc-950/60 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none rounded-2xl" />
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept="image/jpeg,image/png,image/jpg,image/webp" 
              className="hidden" 
            />

            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold text-sm shrink-0">
                {getInitials(currentUser.name)}
              </div>
              <div className="flex-1 space-y-3 relative">
                <textarea
                  value={newPostContent}
                  disabled={!isVerified()}
                  onChange={(e) => {
                    setNewPostContent(e.target.value);
                    handleInputChange(e.target.value, e.target.selectionStart || 0, 'post', e.target);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={isVerified() ? "Share something helpful with your fellow orchard residents (use @ to mention)..." : "Residency verification pending: posting is disabled."}
                  rows={3}
                  className="w-full text-sm py-2 focus:outline-none bg-transparent resize-none disabled:text-slate-400 dark:disabled:text-zinc-500"
                />

                {/* Mentions Dropdown for Post Creation */}
                {mentionActive && mentionTargetInput === 'post' && mentionResults.length > 0 && (
                  <div 
                    className="mention-dropdown absolute bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto py-1"
                    style={{
                      top: dropdownPosition.top + 24,
                      left: Math.max(0, dropdownPosition.left),
                      width: '280px',
                    }}
                  >
                    {mentionResults.map((resident, idx) => (
                      <button
                        key={resident.id}
                        type="button"
                        onClick={() => selectMention(resident)}
                        onMouseEnter={() => setMentionIndex(idx)}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition-colors ${
                          idx === mentionIndex
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[9px] shrink-0 ${
                          resident.id === 'all' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                          {resident.id === 'all' ? '📢' : getInitials(resident.name)}
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-2">
                          <span className={resident.id === 'all' ? 'text-amber-600 dark:text-amber-450 font-bold' : ''}>
                            {resident.id === 'all' ? '@all (Notify Everyone)' : resident.name}
                          </span>
                          {resident.id !== 'all' && resident.resident_profile && (
                            <span className="text-[9px] font-normal text-slate-400 dark:text-zinc-500 shrink-0">
                              {resident.resident_profile.phase} • {resident.resident_profile.block}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Images Preview Grid */}
                {selectedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {selectedImages.map((img) => (
                      <div key={img.previewUrl} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-950 group">
                        <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        {img.status === "uploading" && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {img.status === "error" && (
                          <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center" title="Upload failed">
                            <span className="text-white text-xs">⚠️</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.previewUrl)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white text-[10px] transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-zinc-800 relative z-20">
              <div className="flex gap-2">
                <button 
                  type="button" 
                  disabled={!isVerified() || selectedImages.length >= 3} 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-slate-400 dark:text-zinc-400 hover:bg-neutral-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  title="Attach images (Max 3)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </button>
              </div>
              
              <button
                type="submit"
                disabled={postSubmitting || !newPostContent.trim() || !isVerified() || selectedImages.some(img => img.status === "uploading")}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-xs rounded-full hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all cursor-pointer"
              >
                {postSubmitting ? "Posting..." : "Post to Feed"}
              </button>
            </div>
          </form>

          {/* Feed List */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-8 text-center text-slate-400 dark:text-zinc-400 font-light">
                No recent timeline posts found. Be the first to start the discussion!
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} id={`post-${post.id}`} className="bg-white dark:bg-zinc-900 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/80 p-6 space-y-4 shadow-sm transition-all duration-500">
                  
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {getInitials(post.user.name)}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <span>{post.user.name}</span>
                          <RoleBadge roles={post.user.roles} />
                          {post.user.resident_profile && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/30">
                              {post.user.resident_profile.phase} • {post.user.resident_profile.block}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </div>

                    {currentUser && post.user_id !== currentUser.id && (
                      <button
                        onClick={() => handleOpenFlagModal(post.id)}
                        disabled={post.flagged_by_user}
                        className={`p-2 rounded-lg transition-all border border-transparent ${
                          post.flagged_by_user
                            ? "text-rose-500 cursor-default opacity-80"
                            : "text-slate-400 dark:text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200/30 cursor-pointer"
                        }`}
                        title={post.flagged_by_user ? "You reported this post" : "Report post as inappropriate"}
                      >
                        <svg className="w-4 h-4" fill={post.flagged_by_user ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21v11h-7.5l-1-1H3zm0 0h11v4" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <p className="text-sm font-light leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {renderContentWithMentions(post.content)}
                  </p>

                  {/* Post Images Grid */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className={`mt-3 grid gap-2 overflow-hidden rounded-2xl ${
                      post.media_urls.length === 1 ? 'grid-cols-1' : post.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                    }`}>
                      {post.media_urls.map((url, idx) => (
                        <div 
                          key={idx} 
                          className="relative aspect-video w-full bg-neutral-100 dark:bg-zinc-950 overflow-hidden cursor-zoom-in group border border-neutral-200/20 dark:border-zinc-800/30"
                          onClick={() => setActiveLightbox({ images: post.media_urls || [], index: idx })}
                        >
                          <img 
                            src={url} 
                            alt={`Post image ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" 
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reaction Hooks */}
                  <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 dark:border-zinc-800 text-xs">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        post.liked_by_user 
                          ? "text-rose-500 font-medium" 
                          : "text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300"
                      }`}
                    >
                      <svg className="w-4 h-4" fill={post.liked_by_user ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {post.likes_count} Likes
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.comments_count} Comments
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments[post.id] && (
                    <div className="pt-4 border-t border-neutral-100 dark:border-zinc-800 space-y-4">
                      
                      {/* Comments List */}
                      {loadingComments[post.id] && !comments[post.id] ? (
                        <div className="flex justify-center py-2">
                          <div className="w-4 h-4 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                          {(!comments[post.id] || comments[post.id].length === 0) ? (
                            <p className="text-[11px] text-slate-400 dark:text-zinc-400 italic font-light">
                              No comments yet. Write the first comment!
                            </p>
                          ) : (
                            comments[post.id].map(comment => (
                              <div key={comment.id} id={`comment-${comment.id}`} className="flex gap-2.5 items-start text-xs transition-all duration-300">
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-neutral-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {getInitials(comment.user.name)}
                                </div>
                                <div className="flex-1 bg-slate-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                        {comment.user.name}
                                      </span>
                                      <RoleBadge roles={comment.user.roles} />
                                    </div>
                                    {comment.user.resident_profile && (
                                      <span className="text-[9px] text-slate-400 dark:text-zinc-400 font-light">
                                        {comment.user.resident_profile.phase} • {comment.user.resident_profile.block}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-slate-600 dark:text-zinc-300 font-light mt-0.5 whitespace-pre-wrap leading-normal">
                                    {renderContentWithMentions(comment.content)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Comment Input Box */}
                      {isVerified() ? (
                        <form onSubmit={(e) => handleCreateComment(post.id, e)} className="flex gap-2 relative">
                          <input
                            type="text"
                            placeholder="Write a comment (use @ to mention)..."
                            value={commentInputs[post.id] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCommentInputs(prev => ({ ...prev, [post.id]: val }));
                              handleInputChange(val, e.target.selectionStart || 0, { type: 'comment', postId: post.id }, e.target);
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={commentSubmitting[post.id]}
                            className="flex-1 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />

                          {/* Mentions Dropdown for Comments */}
                          {mentionActive && typeof mentionTargetInput === 'object' && mentionTargetInput?.type === 'comment' && mentionTargetInput.postId === post.id && mentionResults.length > 0 && (
                            <div 
                              className="mention-dropdown absolute bottom-full mb-1 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto py-1"
                              style={{
                                left: Math.max(0, dropdownPosition.left),
                                width: '280px',
                              }}
                            >
                              {mentionResults.map((resident, idx) => (
                                <button
                                  key={resident.id}
                                  type="button"
                                  onClick={() => selectMention(resident)}
                                  onMouseEnter={() => setMentionIndex(idx)}
                                  className={`w-full text-left px-3 py-1.5 text-[11px] flex items-center gap-2 transition-colors ${
                                    idx === mentionIndex
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold"
                                      : "text-slate-700 dark:text-zinc-300 hover:bg-neutral-50 dark:hover:bg-zinc-800/50"
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[8px] shrink-0 ${
                                    resident.id === 'all' ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}>
                                    {resident.id === 'all' ? '📢' : getInitials(resident.name)}
                                  </div>
                                  <div className="flex-1 flex items-center justify-between gap-2">
                                    <span className={resident.id === 'all' ? 'text-amber-600 dark:text-amber-450 font-bold' : ''}>
                                      {resident.id === 'all' ? '@all (Notify Everyone)' : resident.name}
                                    </span>
                                    {resident.id !== 'all' && resident.resident_profile && (
                                      <span className="text-[9px] font-normal text-slate-400 dark:text-zinc-500 shrink-0">
                                        {resident.resident_profile.phase} • {resident.resident_profile.block}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            type="submit"
                            disabled={commentSubmitting[post.id] || !commentInputs[post.id]?.trim()}
                            className="px-3 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-40"
                          >
                            {commentSubmitting[post.id] ? "..." : "Send"}
                          </button>
                        </form>
                      ) : (
                        <div className="bg-slate-50 dark:bg-zinc-800/50 border border-dashed border-neutral-200 dark:border-zinc-800 text-[10px] text-slate-400 dark:text-zinc-400 text-center py-2 rounded-xl">
                          🔒 Verification required to write comments.
                        </div>
                      )}

                    </div>
                  )}

                </div>
              ))
            )}

            {/* Infinite Scroll Loader Target */}
            {hasMore && (
              <div ref={observerTarget} className="flex flex-col items-center justify-center py-6 gap-2">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-light text-slate-500 dark:text-zinc-400">Loading older posts...</p>
              </div>
            )}
          </div>

        </main>

      </div>

      {/* Flag Post Modal */}
      {isFlagModalOpen && flaggingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden animate-scale-up">
            
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-100 flex items-center gap-2">
                🚩 Report Inappropriate Content
              </h3>
              <button 
                onClick={handleCloseFlagModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitFlag} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Why are you reporting this post?
                </label>
                <div className="relative">
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 border border-neutral-200/60 dark:border-zinc-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                  >
                    <option value="spam">Spam or Misleading</option>
                    <option value="harassment">Harassment or Hate Speech</option>
                    <option value="violence">Violence or Harmful Content</option>
                    <option value="inappropriate">Inappropriate or Explicit Content</option>
                    <option value="other">Other / Violation of Rules</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-zinc-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  Additional Context (Optional)
                </label>
                <textarea
                  value={flagComment}
                  onChange={(e) => setFlagComment(e.target.value)}
                  placeholder="Provide any details to help the moderation team understand the issue..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-neutral-100 border border-neutral-200/60 dark:border-zinc-800/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50 resize-none font-light leading-relaxed"
                />
              </div>

              <div className="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed bg-neutral-50 dark:bg-zinc-950/40 border border-neutral-200/50 dark:border-zinc-800/60 p-3 rounded-xl">
                ⚠️ <strong>Moderation Policy</strong>: Reports are logged under your resident identity and sent directly to society administrators. Submitting false reports maliciously may lead to temporary suspension.
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCloseFlagModal}
                  disabled={flagSubmitting}
                  className="px-4 py-2 border border-neutral-200/60 dark:border-zinc-800/80 hover:bg-neutral-50 dark:hover:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={flagSubmitting}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-700 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {flagSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {activeLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 transition-all duration-300"
          onClick={() => setActiveLightbox(null)}
        >
          <button 
            onClick={() => setActiveLightbox(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors cursor-pointer z-50 border border-white/15"
            aria-label="Close lightbox"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative w-full max-w-5xl h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {activeLightbox.images.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightbox(prev => {
                    if (!prev) return null;
                    const newIndex = (prev.index - 1 + prev.images.length) % prev.images.length;
                    return { ...prev, index: newIndex };
                  });
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50 border border-white/15"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="flex items-center justify-center p-2 max-w-full max-h-[85vh]">
              <img 
                src={activeLightbox.images[activeLightbox.index]} 
                alt="Enlarged post content" 
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl select-none" 
              />
            </div>

            {activeLightbox.images.length > 1 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightbox(prev => {
                    if (!prev) return null;
                    const newIndex = (prev.index + 1) % prev.images.length;
                    return { ...prev, index: newIndex };
                  });
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-50 border border-white/15"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          
          {activeLightbox.images.length > 1 && (
            <div className="absolute bottom-6 text-xs text-white/60 font-semibold tracking-wider bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
              {activeLightbox.index + 1} / {activeLightbox.images.length}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// Helper to parse markdown mentions into beautiful React tags
export const renderContentWithMentions = (content: string) => {
  if (!content) return "";

  const regex = /@\[([^\]]+)\]\(user:([a-fA-F0-9-]+|all)\)/g;
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;
    const name = match[1];
    const userId = match[2];

    if (matchIndex > lastIndex) {
      parts.push(content.substring(lastIndex, matchIndex));
    }

    const isAll = userId === "all";

    parts.push(
      <span
        key={`${userId}-${matchIndex}`}
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
          isAll
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-450 border border-amber-200/30 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
        } cursor-pointer transition-colors`}
      >
        @{name}
      </span>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts.length > 0 ? parts : content;
};
