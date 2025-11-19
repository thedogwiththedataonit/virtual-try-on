"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dithering } from "@paper-design/shaders-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMobile } from "@/hooks/use-mobile"

interface GeneratedImage {
  url: string
  prompt: string
  description?: string
  modelIndex?: number
  productIndex?: number
}

interface Generation {
  id: string
  status: "loading" | "complete" | "error"
  progress: number
  imageUrl: string | null
  prompt: string
  error?: string
  timestamp: number
  abortController?: AbortController
  thumbnailLoaded?: boolean
  modelIndex?: number
  productIndex?: number
}

export function ImageCombiner() {
  const isMobile = useMobile()
  
  // Model images (people/mannequins to try on)
  const [modelImages, setModelImages] = useState<File[]>([])
  const [modelPreviews, setModelPreviews] = useState<string[]>([])
  
  // Product images (clothing, accessories, items)
  const [productImages, setProductImages] = useState<File[]>([])
  const [productPreviews, setProductPreviews] = useState<string[]>([])
  
  const [isConvertingHeic, setIsConvertingHeic] = useState(false)
  const [heicProgress, setHeicProgress] = useState(0)

  const [generations, setGenerations] = useState<Generation[]>([])
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)

  const selectedGeneration = generations.find((g) => g.id === selectedGenerationId) || generations[0]
  const isLoading = generations.some((g) => g.status === "loading")
  const generatedImage =
    selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
      ? { 
          url: selectedGeneration.imageUrl, 
          prompt: selectedGeneration.prompt,
          modelIndex: selectedGeneration.modelIndex,
          productIndex: selectedGeneration.productIndex
        }
      : null

  const [showAnimation, setShowAnimation] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [prompt, setPrompt] = useState("Model wearing the product naturally, professional ecommerce photography. Depending on the article of clothing, the model should be wearing it in a natural way, not forced.")
  const [isDragOver, setIsDragOver] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string>("")
  const [aspectRatio, setAspectRatio] = useState<string>("portrait")
  const [generateAll, setGenerateAll] = useState(true)
  const [availableAspectRatios, setAvailableAspectRatios] = useState<
    Array<{ value: string; label: string; ratio: number; icon: React.ReactNode }>
  >([
    {
      value: "square",
      label: "1:1",
      ratio: 1,
      icon: (
        <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
    },
    {
      value: "portrait",
      label: "9:16",
      ratio: 9 / 16,
      icon: (
        <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="8" y="4" width="8" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
    },
    {
      value: "landscape",
      label: "16:9",
      ratio: 16 / 9,
      icon: (
        <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="8" width="16" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
    },
    {
      value: "wide",
      label: "21:9",
      ratio: 21 / 9,
      icon: (
        <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="9" width="20" height="6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
    },
  ])
  // const [abortController, setAbortController] = useState<AbortController | null>(null) // Removed as it's now per-generation
  // const currentGenerationIdRef = useRef<string | null>(null) // Removed as it's now per-generation

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (selectedGeneration?.status === "complete" && selectedGeneration?.imageUrl) {
      setImageLoaded(false)
    }
  }, [selectedGenerationId, selectedGeneration?.imageUrl])

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const validateImageFormat = (file: File): boolean => {
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/gif",
      "image/bmp",
      "image/tiff",
    ]

    // Check MIME type first
    if (supportedTypes.includes(file.type.toLowerCase())) {
      return true
    }

    // Fallback: check file extension for HEIC files (browsers sometimes don't set correct MIME type)
    const fileName = file.name.toLowerCase()
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".gif", ".bmp", ".tiff"]

    return supportedExtensions.some((ext) => fileName.endsWith(ext))
  }

  const hasImages = modelImages.length > 0 && productImages.length > 0
  const currentMode = "virtual-try-on"

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // Handle image files - always handle images regardless of focus
        if (item.type.startsWith("image/")) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            // Add to models by default
            handleImageUpload(file, "model")
          }
          return
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [modelImages, productImages])

  const compressImage = async (file: File, maxWidth = 1280, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg", // Use JPEG for better compression
                lastModified: Date.now(),
              })
              console.log("[v0] Image compressed from", file.size, "to", blob.size, "bytes")
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback to original if compression fails
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const convertHeicToPng = async (file: File): Promise<File> => {
    try {
      setHeicProgress(0)

      // Simulate progress during conversion
      const progressInterval = setInterval(() => {
        setHeicProgress((prev) => {
          if (prev >= 95) return prev
          return prev + Math.random() * 15 + 5
        })
      }, 50)

      // Import heic-to dynamically
      const { heicTo } = await import("heic-to")

      setHeicProgress(70)

      const convertedBlob = await heicTo({
        blob: file,
        type: "image/jpeg",
        quality: 0.9,
      })

      setHeicProgress(90)

      const convertedFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
      })

      clearInterval(progressInterval)
      setHeicProgress(100)

      // Small delay to show 100%
      await new Promise((resolve) => setTimeout(resolve, 200))

      return convertedFile
    } catch (error) {
      console.error("[v0] HEIC conversion error:", error)
      throw new Error("Could not convert HEIC image. Please try using a different image format.")
    }
  }

  const detectAspectRatio = (width: number, height: number): string => {
    const ratio = width / height

    // Default options that are always visible
    const defaultOptions = ["square", "portrait", "landscape", "wide"]

    // All possible aspect ratios
    const allRatios = [
      {
        value: "square",
        label: "1:1",
        ratio: 1,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "portrait",
        label: "9:16",
        ratio: 9 / 16,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="8" y="4" width="8" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "landscape",
        label: "16:9",
        ratio: 16 / 9,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="8" width="16" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "wide",
        label: "21:9",
        ratio: 21 / 9,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="9" width="20" height="6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "4:3",
        label: "4:3",
        ratio: 4 / 3,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="7" width="14" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "3:2",
        label: "3:2",
        ratio: 3 / 2,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="4" y="8" width="16" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "2:3",
        label: "2:3",
        ratio: 2 / 3,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="8" y="4" width="8" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "3:4",
        label: "3:4",
        ratio: 3 / 4,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="7" y="5" width="10" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "5:4",
        label: "5:4",
        ratio: 5 / 4,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="5" y="7" width="14" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        value: "4:5",
        label: "4:5",
        ratio: 4 / 5,
        icon: (
          <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="7" y="5" width="10" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
    ]

    // Find the closest match
    let closestMatch = allRatios[0]
    let smallestDiff = Math.abs(ratio - closestMatch.ratio)

    for (const option of allRatios) {
      const diff = Math.abs(ratio - option.ratio)
      if (diff < smallestDiff) {
        smallestDiff = diff
        closestMatch = option
      }
    }

    // If the best match is not in default options, add it to available options
    if (!defaultOptions.includes(closestMatch.value)) {
      setAvailableAspectRatios((prev) => {
        // Check if this ratio is already in the list
        const exists = prev.some((r) => r.value === closestMatch.value)
        if (!exists) {
          // Add the new ratio and sort by ratio value
          return [...prev, closestMatch].sort((a, b) => a.ratio - b.ratio)
        }
        return prev
      })
    }

    return closestMatch.value
  }

  const handleImageUpload = async (file: File, type: "model" | "product") => {
    console.log("[v0] Uploading image:", file.name, "for type:", type)

    if (!validateImageFormat(file)) {
      showToast("Please select a valid image file.", "error")
      return
    }

    let processedFile = file
    const isHeic =
      file.type.toLowerCase().includes("heic") ||
      file.type.toLowerCase().includes("heif") ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif")

    if (isHeic) {
      try {
        console.log("[v0] Converting HEIC image to JPEG...")
        setIsConvertingHeic(true)
        processedFile = await convertHeicToPng(file)
        console.log("[v0] HEIC conversion successful")
        setIsConvertingHeic(false)
      } catch (error) {
        console.error("[v0] Error converting HEIC:", error)
        setIsConvertingHeic(false)
        showToast("Error converting HEIC image. Please try a different format.", "error")
        return
      }
    }

    try {
      console.log("[v0] Compressing image for optimal API performance...")
      processedFile = await compressImage(processedFile)
      console.log("[v0] Image compression successful")
    } catch (error) {
      console.error("[v0] Error compressing image:", error)
      // Continue with uncompressed image if compression fails
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      console.log("[v0] Image loaded successfully, setting preview for type", type)

      const img = new Image()
      img.onload = () => {
        if (type === "model" && modelImages.length === 0) {
          const detectedRatio = detectAspectRatio(img.width, img.height)
          setAspectRatio(detectedRatio)
          console.log("[v0] Auto-detected aspect ratio:", detectedRatio, "from dimensions:", img.width, "x", img.height)
          showToast(`Aspect ratio set to ${detectedRatio}`, "success")
        }
      }
      img.src = result

      if (type === "model") {
        setModelImages((prev) => [...prev, processedFile])
        setModelPreviews((prev) => [...prev, result])
        showToast("Model image added", "success")
      } else {
        setProductImages((prev) => [...prev, processedFile])
        setProductPreviews((prev) => [...prev, result])
        showToast("Product image added", "success")
      }
    }
    reader.onerror = (error) => {
      console.error("[v0] Error reading file:", error)
      showToast("Error reading the image file. Please try again.", "error")
    }
    reader.readAsDataURL(processedFile)
  }

  const handleDrop = (e: React.DragEvent, type: "model" | "product") => {
    e.preventDefault()
    setIsDragOver(false)
    console.log("[v0] File dropped for type", type)
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
    if (file && file.type.startsWith("image/")) {
      console.log("[v0] Valid image file dropped:", file.name)
        handleImageUpload(file, type)
    } else {
      console.log("[v0] Invalid file type or no file:", file?.type)
      showToast("Please drop a valid image file", "error")
    }
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "model" | "product") => {
    console.log("[v0] File input changed for type", type)
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      console.log("[v0] File selected:", file.name, file.type)
      handleImageUpload(file, type)
    })
      e.target.value = ""
  }

  const preloadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = url
    })
  }

  const openFullscreen = () => {
    if (generatedImage?.url) {
      setFullscreenImageUrl(generatedImage.url)
      setShowFullscreen(true)
    }
  }

  const openImageFullscreen = (imageUrl: string) => {
    setFullscreenImageUrl(imageUrl)
    setShowFullscreen(true)
  }

  const closeFullscreen = () => {
    setShowFullscreen(false)
    setFullscreenImageUrl("")
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullscreen) {
        closeFullscreen()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [showFullscreen])

  useEffect(() => {
    if (showFullscreen) {
      // Save current overflow value
      const originalOverflow = document.body.style.overflow
      // Prevent scrolling
      document.body.style.overflow = "hidden"

      // Restore on cleanup
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [showFullscreen])

  const cancelGeneration = (generationId: string) => {
    const generation = generations.find((g) => g.id === generationId)
    if (generation?.abortController) {
      generation.abortController.abort()
    }

    // Immediately mark as cancelled
    setGenerations((prev) =>
      prev.map((gen) =>
        gen.id === generationId && gen.status === "loading"
          ? { ...gen, status: "error" as const, error: "Cancelled by user", progress: 0, abortController: undefined }
          : gen,
      ),
    )
    showToast("Generation cancelled", "error")
  }

  const generateImage = async () => {
    if (!canGenerate) return

    const generationPromises = []

    // Determine which combinations to generate
    const combinations: Array<{ modelIdx: number; productIdx: number }> = []
    
    if (generateAll) {
      // Generate all combinations
      for (let m = 0; m < modelImages.length; m++) {
        for (let p = 0; p < productImages.length; p++) {
          combinations.push({ modelIdx: m, productIdx: p })
        }
      }
    } else {
      // Generate first model with all products, or first of each
      for (let p = 0; p < productImages.length; p++) {
        combinations.push({ modelIdx: 0, productIdx: p })
      }
    }

    showToast(`Generating ${combinations.length} virtual try-on images...`, "success")

    for (let i = 0; i < combinations.length; i++) {
      const { modelIdx, productIdx } = combinations[i]
      const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const controller = new AbortController()

      const newGeneration: Generation = {
        id: generationId,
        status: "loading",
        progress: 0,
        imageUrl: null,
        prompt: prompt,
        timestamp: Date.now() + i,
        abortController: controller,
        modelIndex: modelIdx,
        productIndex: productIdx,
      }

      setGenerations((prev) => [newGeneration, ...prev])

      // Set the first generation as selected
      if (i === 0) {
        setSelectedGenerationId(generationId)
      }

      // Start progress interval for this generation
      const progressInterval = setInterval(() => {
        setGenerations((prev) =>
          prev.map((gen) => {
            if (gen.id === generationId && gen.status === "loading") {
              const next =
                gen.progress >= 98
                  ? 98
                  : gen.progress >= 96
                    ? gen.progress + 0.2
                    : gen.progress >= 90
                      ? gen.progress + 0.5
                      : gen.progress >= 75
                        ? gen.progress + 0.8
                        : gen.progress >= 50
                          ? gen.progress + 1
                          : gen.progress >= 25
                            ? gen.progress + 1.2
                            : gen.progress + 1.5
              return { ...gen, progress: Math.min(next, 98) }
            }
            return gen
          }),
        )
      }, 100)

      // Create the generation promise
      const generationPromise = (async () => {
        try {
          const formData = new FormData()
          formData.append("mode", "virtual-try-on")
          formData.append("prompt", prompt)
          formData.append("aspectRatio", aspectRatio)
          formData.append("model", modelImages[modelIdx])
          formData.append("product", productImages[productIdx])

          const response = await fetch("/api/generate-image", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
            throw new Error(`${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`)
          }

          const data = await response.json()

          try {
            await preloadImage(data.url)
          } catch (error) {
            console.error("[v0] Error preloading image:", error)
          }

          clearInterval(progressInterval)

          setGenerations((prev) =>
            prev.map((gen) => {
              if (gen.id === generationId) {
                if (gen.status === "loading") {
                  return {
                    ...gen,
                    status: "complete" as const,
                    progress: 100,
                    imageUrl: data.url,
                    abortController: undefined,
                    thumbnailLoaded: true,
                  }
                }
                return gen
              }
              return gen
            }),
          )

          if (selectedGenerationId === generationId) {
            setImageLoaded(true)
          }
        } catch (error) {
          clearInterval(progressInterval)

          if (error instanceof Error && error.name === "AbortError") {
            console.log("[v0] Generation fetch aborted for:", generationId)
            return
          }

          console.error("Error generating image:", error)

          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

          setGenerations((prev) =>
            prev.map((gen) =>
              gen.id === generationId && gen.status === "loading"
                ? { ...gen, status: "error" as const, error: errorMessage, progress: 0, abortController: undefined }
                : gen,
            ),
          )

          showToast(`Error generating image: ${errorMessage}`, "error")
        }
      })()

      generationPromises.push(generationPromise)
      
      // Add a small delay between requests to avoid overwhelming the API
      if (i < combinations.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Wait for all generations to complete
    await Promise.all(generationPromises)
    showToast("All virtual try-on images generated!", "success")
  }

  const downloadImage = async () => {
    if (generatedImage) {
      try {
        const response = await fetch(generatedImage.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `virtual-tryon-model${generatedImage.modelIndex}-product${generatedImage.productIndex}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("Error downloading image:", error)
        window.open(generatedImage.url, "_blank")
      }
    }
  }

  const downloadAllImages = async () => {
    const completedGenerations = generations.filter((g) => g.status === "complete" && g.imageUrl)
    
    if (completedGenerations.length === 0) {
      showToast("No images to download", "error")
      return
    }

    showToast(`Downloading ${completedGenerations.length} images...`, "success")

    for (let i = 0; i < completedGenerations.length; i++) {
      const gen = completedGenerations[i]
      try {
        const response = await fetch(gen.imageUrl!)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `virtual-tryon-model${gen.modelIndex}-product${gen.productIndex}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (error) {
        console.error("Error downloading image:", error)
      }
    }

    showToast("All images downloaded!", "success")
  }

  const openImageInNewTab = () => {
    if (generatedImage) {
      window.open(generatedImage.url, "_blank")
    }
  }

  const copyImageToClipboard = async () => {
    if (generatedImage) {
      try {
        setToast({ message: "Copying image...", type: "success" })

        // Ensure window is focused
        window.focus()

        // Try direct fetch first (works in development), fallback to proxy
        let response
        try {
          response = await fetch(generatedImage.url, { mode: "cors" })
        } catch {
          // Fallback to proxy for production CORS issues
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(generatedImage.url)}`
          response = await fetch(proxyUrl)
        }

        if (!response.ok) {
          throw new Error("Failed to fetch image")
        }

        const blob = await response.blob()
        const clipboardItem = new ClipboardItem({ "image/png": blob })
        await navigator.clipboard.write([clipboardItem])

        setToast({ message: "Image copied to clipboard!", type: "success" })
        setTimeout(() => setToast(null), 2000)
      } catch (error) {
        console.error("Error copying image:", error)
        if (error instanceof Error && error.message.includes("not focused")) {
          setToast({ message: "Please click on the page first, then try copying again", type: "error" })
        } else {
          setToast({ message: "Failed to copy image to clipboard", type: "error" })
        }
      }
    }
  }

  const clearImage = (type: "model" | "product", index: number) => {
    if (type === "model") {
      setModelImages((prev) => prev.filter((_, i) => i !== index))
      setModelPreviews((prev) => prev.filter((_, i) => i !== index))
    } else {
      setProductImages((prev) => prev.filter((_, i) => i !== index))
      setProductPreviews((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const clearAllImages = () => {
    setModelImages([])
    setModelPreviews([])
    setProductImages([])
    setProductPreviews([])
    showToast("All images cleared", "success")
  }

  const loadImageFromUrl = async (url: string, filename: string): Promise<File | null> => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch image')
      const blob = await response.blob()
      const file = new File([blob], filename, { type: blob.type })
      return file
    } catch (error) {
      console.error(`Error loading image from ${url}:`, error)
      return null
    }
  }

  const loadDemoImages = async () => {
    showToast("Loading demo images...", "success")
    
    // Clear existing images first
    setModelImages([])
    setModelPreviews([])
    setProductImages([])
    setProductPreviews([])
    
    // Load model image
    const modelUrl = '/model1.jpg'
    const modelFile = await loadImageFromUrl(modelUrl, 'model1.jpg')
    if (modelFile) {
      await handleImageUpload(modelFile, "model")
    }
    
    // Load outfit images
    const outfitUrls = [
      '/cream-dress.webp',
      '/pants.webp',
      '/pants2.webp',
      '/outfit.webp',
      '/dress.webp'
    ]
    
    for (const url of outfitUrls) {
      const filename = url.substring(1) // Remove leading slash
      const file = await loadImageFromUrl(url, filename)
      if (file) {
        await handleImageUpload(file, "product")
      }
      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    showToast("Demo images loaded!", "success")
  }

  const canGenerate = prompt.trim().length > 0 && modelImages.length > 0 && productImages.length > 0

  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true)
    }
  }

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
    if (file && file.type.startsWith("image/")) {
        // Default to adding as models
        handleImageUpload(file, "model")
      } else {
        showToast("Please drop valid image files", "error")
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      if (canGenerate) {
        generateImage()
      }
    }
  }

  return (
    <div
      className="bg-background min-h-screen flex items-center justify-center select-none"
      onDragEnter={handleGlobalDragEnter}
      onDragLeave={handleGlobalDragLeave}
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 select-none">
          <div
            className={cn(
              "bg-black/90 backdrop-blur-sm border rounded-lg p-4 shadow-lg max-w-sm",
              toast.type === "success" ? "border-green-500/50 text-green-100" : "border-red-500/50 text-red-100",
            )}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? (
                <svg
                  className="w-5 h-5 text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12m0 0l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}

      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center select-none">
          <div className="bg-white/10 border-2 border-dashed border-white/50 rounded-xl p-8 md:p-12 text-center mx-4">
            <svg
              className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Drop Images Here</h3>
            <p className="text-gray-300 text-sm md:text-base">Release to upload your images</p>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-0 select-none">
        <Dithering
          colorBack="#00000000"
          colorFront="#614B00"
          speed={0.43}
          shape="wave"
          type="4x4"
          pxSize={3}
          scale={1.13}
          style={{
            backgroundColor: "#000000",
            height: "100vh",
            width: "100vw",
          }}
        />
      </div>

      <div
        className={cn(
          "relative z-10 p-2 md:p-6 w-full max-w-6xl mx-auto select-none transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        )}
      >
        <div className="bg-black/70 backdrop-blur-sm border-0 p-3 md:p-8 rounded-xl">
          <div
            className={cn(
              "mb-4 md:mb-8 transition-all duration-700 ease-out delay-100",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <h1 className="text-lg md:text-2xl font-bold text-white select-none">Virtual Try-On Catalog Generator</h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Upload model photos and product images to create an ecommerce catalog</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Configuration Bar */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 transition-all duration-700 ease-out delay-200",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              <div className="flex items-center gap-2">
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger
                        size="sm"
                    className="w-28 md:w-32 !h-8 md:!h-10 bg-black/50 border-gray-600 text-white text-xs md:text-sm"
                      >
                    <SelectValue placeholder="9:16" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-gray-600 text-white">
                        {availableAspectRatios.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs md:text-sm">
                            <div className="flex items-center gap-2">
                              {option.icon}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                
                <div className="flex items-center gap-2 bg-black/50 border border-gray-600 rounded px-3 py-2">
                  <input
                    type="checkbox"
                    id="generateAll"
                    checked={generateAll}
                    onChange={(e) => setGenerateAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="generateAll" className="text-xs md:text-sm text-white cursor-pointer">
                    Generate all combinations
                  </label>
                  </div>
                </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={loadDemoImages}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
                >
                  Load Demo
                </Button>
                {(modelImages.length > 0 || productImages.length > 0) && (
                    <Button
                    onClick={clearAllImages}
                      variant="outline"
                      size="sm"
                    className="h-8 px-3 text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
                    >
                    Clear All
                    </Button>
                )}
                {generations.filter((g) => g.status === "complete").length > 0 && (
                  <Button
                    onClick={downloadAllImages}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
                  >
                    Download All ({generations.filter((g) => g.status === "complete").length})
                  </Button>
                )}
                      </div>
                    </div>

            {/* Upload Sections */}
            <div
              className={cn(
                "grid md:grid-cols-2 gap-4 transition-all duration-700 ease-out delay-300",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              {/* Model Images Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                    Models ({modelImages.length})
                  </h3>
                        </div>
                <div className="grid grid-cols-3 gap-2">
                  {modelPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square border border-white rounded overflow-hidden group cursor-pointer"
                      onClick={() => openImageFullscreen(preview)}
                    >
                      <img src={preview} alt={`Model ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                          clearImage("model", index)
                        }}
                        className="absolute top-1 right-1 bg-black/80 hover:bg-white/90 text-white hover:text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </div>
                  ))}
                  <div
                    className="aspect-square border-2 border-dashed border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-white transition-colors bg-black/30"
                    onClick={() => document.getElementById("modelInput")?.click()}
                    onDrop={(e) => handleDrop(e, "model")}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="text-center text-gray-400">
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                      <p className="text-xs">Add Model</p>
                              </div>
                  </div>
                </div>
                            <input
                  id="modelInput"
                              type="file"
                              accept="image/*,.heic,.heif"
                  multiple
                              className="hidden"
                  onChange={(e) => handleFileSelect(e, "model")}
                            />
                          </div>

              {/* Product Images Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Products ({productImages.length})
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {productPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square border border-white rounded overflow-hidden group cursor-pointer"
                      onClick={() => openImageFullscreen(preview)}
                    >
                      <img src={preview} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                          clearImage("product", index)
                        }}
                        className="absolute top-1 right-1 bg-black/80 hover:bg-white/90 text-white hover:text-black rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </div>
                  ))}
                  <div
                    className="aspect-square border-2 border-dashed border-gray-600 rounded flex items-center justify-center cursor-pointer hover:border-white transition-colors bg-black/30"
                    onClick={() => document.getElementById("productInput")?.click()}
                    onDrop={(e) => handleDrop(e, "product")}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="text-center text-gray-400">
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                      <p className="text-xs">Add Product</p>
                              </div>
                  </div>
                </div>
                            <input
                  id="productInput"
                              type="file"
                              accept="image/*,.heic,.heif"
                  multiple
                              className="hidden"
                  onChange={(e) => handleFileSelect(e, "product")}
                            />
                  </div>
                </div>

            {/* Prompt Section */}
            <div
              className={cn(
                "space-y-3 transition-all duration-700 ease-out delay-400",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              <div className="flex items-center justify-between select-none">
                <label className="text-xs md:text-sm font-medium text-gray-300">
                  Virtual Try-On Instructions
                </label>
                  <Button
                  onClick={() => setPrompt("Model wearing the product naturally, professional ecommerce photography")}
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs bg-transparent border-gray-600 text-white hover:bg-gray-700"
                >
                  Reset
                  </Button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe how the model should wear the product..."
                className="w-full h-20 md:h-24 p-2 md:p-4 bg-black/50 border border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-white text-white text-xs md:text-sm select-text"
                style={{
                  fontSize: "16px",
                  WebkitUserSelect: "text",
                  userSelect: "text",
                }}
              />
                </div>

            {/* Generate Button */}
            <div
              className={cn(
                "transition-all duration-700 ease-out delay-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
                  <Button
                    onClick={generateImage}
                disabled={!canGenerate || isConvertingHeic || isLoading}
                className="w-full h-12 text-base font-semibold bg-white text-black hover:bg-gray-200 rounded disabled:opacity-50"
              >
                {isConvertingHeic 
                  ? "Converting HEIC..." 
                  : isLoading 
                    ? `Generating ${generations.filter(g => g.status === "loading").length} images...`
                    : `Generate ${generateAll ? modelImages.length * productImages.length : productImages.length} Virtual Try-On${generateAll && modelImages.length * productImages.length > 1 ? "s" : ""}`
                }
                  </Button>
            </div>

            {/* Catalog Grid */}
            {generations.length > 0 && (
            <div
              className={cn(
                  "transition-all duration-700 ease-out delay-600",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
                <h3 className="text-sm md:text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21,15 16,10 5,21" />
                  </svg>
                  Virtual Try-On Catalog ({generations.filter(g => g.status === "complete").length} of {generations.length})
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {generations.map((gen, index) => (
                    <div
                      key={gen.id}
                      className={cn(
                        "relative aspect-[3/4] bg-black/30 border border-gray-600 rounded-lg overflow-hidden group",
                        index === 0 && "animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
                      )}
                    >
                      {gen.status === "loading" ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-3/4 bg-black/50 border border-gray-600 rounded overflow-hidden mb-2">
                            <div
                              className="h-2 bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-300"
                              style={{ width: `${gen.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-white/80 font-mono">{Math.round(gen.progress)}%</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              cancelGeneration(gen.id)
                            }}
                            className="mt-2 text-[10px] px-2 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/30 text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : gen.status === "error" ? (
                        <div className="absolute inset-0 bg-red-900/30 flex flex-col items-center justify-center p-2">
                          <svg className="w-8 h-8 text-red-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <p className="text-xs text-red-200 text-center">{gen.error || "Error"}</p>
                        </div>
                      ) : gen.imageUrl ? (
                        <>
                          <img
                            src={gen.imageUrl}
                            alt={`Model ${gen.modelIndex! + 1} - Product ${gen.productIndex! + 1}`}
                            className={cn(
                              "w-full h-full object-cover transition-all duration-500 cursor-pointer",
                              gen.thumbnailLoaded ? "opacity-100" : "opacity-0",
                            )}
                            loading="lazy"
                            onLoad={() => {
                              setGenerations((prev) =>
                                prev.map((g) => (g.id === gen.id ? { ...g, thumbnailLoaded: true } : g)),
                              )
                            }}
                            onClick={() => openImageFullscreen(gen.imageUrl!)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="font-semibold">M{gen.modelIndex! + 1} × P{gen.productIndex! + 1}</p>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  const response = await fetch(gen.imageUrl!)
                                  const blob = await response.blob()
                                  const url = window.URL.createObjectURL(blob)
                                  const link = document.createElement("a")
                                  link.href = url
                                  link.download = `virtual-tryon-model${gen.modelIndex}-product${gen.productIndex}.png`
                                  link.click()
                                  window.URL.revokeObjectURL(url)
                                  showToast("Downloaded!", "success")
                                } catch (error) {
                                  showToast("Download failed", "error")
                                }
                              }}
                              className="p-1.5 bg-black/80 hover:bg-white/90 text-white hover:text-black rounded-full transition-all"
                              title="Download"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {showFullscreen && fullscreenImageUrl && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 select-none overflow-hidden"
          onClick={closeFullscreen}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full transition-all duration-200"
              title="Close (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <img
              src={fullscreenImageUrl || "/placeholder.svg"}
              alt="Fullscreen"
              className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageCombiner
