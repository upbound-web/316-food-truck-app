import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import { MenuItemImage } from "./components/MenuItemImage";

type Size = {
  name: string;
  priceModifier: number;
};

type Customization = {
  name: string;
  price: number;
  category?: string; // "milk", "syrup", "sugar", "extras", "addons"
};

const CUSTOMIZATION_CATEGORIES = [
  { value: "milk", label: "🥛 Milk Options" },
  { value: "syrup", label: "🍯 Syrups & Flavors" },
  { value: "sugar", label: "🍬 Sugar Level" },
  { value: "extras", label: "✨ Extras" },
  { value: "addons", label: "🍽️ Add-ons" },
];

type MenuItem = {
  _id: Id<"menuItems">;
  _creationTime: number;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  image?: string;
  imageId?: Id<"_storage">;
  available: boolean;
  sizes: Size[];
  customizations: Customization[];
};

type MenuItemFormData = {
  name: string;
  description: string;
  basePrice: string;
  category: string;
  image: string; // Legacy filename
  imageId?: Id<"_storage">; // New: storage ID
  available: boolean;
  sizes: Size[];
  customizations: Customization[];
};

const emptyFormData: MenuItemFormData = {
  name: "",
  description: "",
  basePrice: "",
  category: "",
  image: "",
  imageId: undefined,
  available: true,
  sizes: [{ name: "Regular", priceModifier: 0 }],
  customizations: [],
};

export function MenuManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>(emptyFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const menuItems = useQuery(api.menu.getAllMenuItemsAdmin);
  const addMenuItem = useMutation(api.menu.addMenuItem);
  const updateMenuItem = useMutation(api.menu.updateMenuItem);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  // Get image URL for preview when editing
  const existingImageUrl = useQuery(
    api.files.getImageUrl,
    editingItem?.imageId ? { storageId: editingItem.imageId } : "skip"
  );

  const resetForm = () => {
    setFormData(emptyFormData);
    setIsModalOpen(false);
    setEditingItem(null);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openAddModal = () => {
    setFormData(emptyFormData);
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      basePrice: item.basePrice.toString(),
      category: item.category,
      image: item.image || "",
      imageId: item.imageId,
      available: item.available,
      sizes: [...item.sizes],
      customizations: [...item.customizations],
    });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  // Compress and resize image before upload
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        // Max dimensions - enough for retina displays at ~600px display width
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new file with the compressed blob
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                }
              );
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          0.8 // 80% quality - good balance of quality and size
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 10MB for input, will be compressed)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }

      try {
        // Compress the image before storing
        const compressedFile = await compressImage(file);

        // Check compressed size (should be much smaller now)
        if (compressedFile.size > 2 * 1024 * 1024) {
          toast.error(
            "Image is still too large after compression. Try a smaller image."
          );
          return;
        }

        setImageFile(compressedFile);

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch {
        toast.error("Failed to process image");
      }
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddSize = () => {
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { name: "", priceModifier: 0 }],
    });
  };

  const handleRemoveSize = (index: number) => {
    setFormData({
      ...formData,
      sizes: formData.sizes.filter((_, i) => i !== index),
    });
  };

  const handleSizeChange = (
    index: number,
    field: keyof Size,
    value: string | number
  ) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleAddCustomization = () => {
    setFormData({
      ...formData,
      customizations: [
        ...formData.customizations,
        { name: "", price: 0, category: "addons" },
      ],
    });
  };

  const handleRemoveCustomization = (index: number) => {
    setFormData({
      ...formData,
      customizations: formData.customizations.filter((_, i) => i !== index),
    });
  };

  const handleCustomizationChange = (
    index: number,
    field: keyof Customization,
    value: string | number
  ) => {
    const newCustomizations = [...formData.customizations];
    newCustomizations[index] = { ...newCustomizations[index], [field]: value };
    setFormData({ ...formData, customizations: newCustomizations });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (!formData.category.trim()) {
      toast.error("Please enter a category");
      return;
    }
    if (formData.sizes.length === 0) {
      toast.error("Please add at least one size");
      return;
    }
    if (formData.sizes.some((s) => !s.name.trim())) {
      toast.error("Please fill in all size names");
      return;
    }

    try {
      setIsUploading(true);

      // Upload image if a new one is selected
      let uploadedImageId: Id<"_storage"> | undefined = formData.imageId;

      if (imageFile) {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload the file
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await response.json();
        uploadedImageId = storageId;
      }

      if (editingItem) {
        await updateMenuItem({
          id: editingItem._id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          basePrice: parseFloat(formData.basePrice),
          category: formData.category.trim().toLowerCase(),
          image: formData.image.trim() || undefined,
          imageId: uploadedImageId,
          available: formData.available,
          sizes: formData.sizes.map((s) => ({
            name: s.name.trim(),
            priceModifier: Number(s.priceModifier),
          })),
          customizations: formData.customizations
            .filter((c) => c.name.trim())
            .map((c) => ({
              name: c.name.trim(),
              price: Number(c.price),
              category: c.category,
            })),
        });
        toast.success(`"${formData.name}" updated successfully`);
      } else {
        await addMenuItem({
          name: formData.name.trim(),
          description: formData.description.trim(),
          basePrice: parseFloat(formData.basePrice),
          category: formData.category.trim().toLowerCase(),
          image: formData.image.trim() || undefined,
          imageId: uploadedImageId,
          available: formData.available,
          sizes: formData.sizes.map((s) => ({
            name: s.name.trim(),
            priceModifier: Number(s.priceModifier),
          })),
          customizations: formData.customizations
            .filter((c) => c.name.trim())
            .map((c) => ({
              name: c.name.trim(),
              price: Number(c.price),
              category: c.category,
            })),
        });
        toast.success(`"${formData.name}" added successfully`);
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save menu item");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await updateMenuItem({
        id: item._id,
        available: !item.available,
      });
      toast.success(
        `"${item.name}" is now ${!item.available ? "available" : "unavailable"}`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update availability");
    }
  };

  if (!menuItems) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group items by category
  const categories = [
    ...new Set(menuItems.map((item) => item.category)),
  ].sort();

  return (
    <div className="bg-white rounded-lg shadow border p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Menu Items</h3>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          + Add New Item
        </button>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={resetForm}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 z-10">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem
                  ? `Edit "${editingItem.name}"`
                  : "Add New Menu Item"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Flat White"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., coffee, iced, food"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Base Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (AUD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({ ...formData, basePrice: e.target.value })
                    }
                    placeholder="5.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Base Price - span full width on its own row */}
              </div>

              {/* Image Upload Section */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Product Image
                </label>

                {/* Current/Preview Image */}
                {(imagePreview || existingImageUrl || formData.image) && (
                  <div className="mb-3">
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={
                          imagePreview ||
                          existingImageUrl ||
                          `/${formData.image}`
                        }
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                        }}
                      />
                      {(imagePreview || existingImageUrl) && (
                        <button
                          type="button"
                          onClick={clearImageSelection}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {existingImageUrl && !imagePreview && (
                      <p className="text-xs text-gray-500 mt-1">
                        Current uploaded image
                      </p>
                    )}
                    {imagePreview && (
                      <p className="text-xs text-green-600 mt-1">
                        New image selected
                      </p>
                    )}
                    {!existingImageUrl && !imagePreview && formData.image && (
                      <p className="text-xs text-gray-500 mt-1">
                        Legacy image: {formData.image}
                      </p>
                    )}
                  </div>
                )}

                {/* File Upload Input */}
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                  >
                    {imagePreview || existingImageUrl
                      ? "Change Image"
                      : "Upload Image"}
                  </label>
                  <span className="text-xs text-gray-500">
                    Max 5MB • JPG, PNG, GIF, WebP
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the item"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Available Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.available}
                    onChange={(e) =>
                      setFormData({ ...formData, available: e.target.checked })
                    }
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Available for ordering
                  </span>
                </label>
              </div>

              {/* Sizes */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Sizes *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    + Add Size
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={size.name}
                        onChange={(e) =>
                          handleSizeChange(index, "name", e.target.value)
                        }
                        placeholder="Size name (e.g., Medium)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={size.priceModifier}
                          onChange={(e) =>
                            handleSizeChange(
                              index,
                              "priceModifier",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                        />
                      </div>
                      {formData.sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(index)}
                          className="text-red-500 hover:text-red-700 text-xl px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Customizations */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Customizations (optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddCustomization}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    + Add Customization
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.customizations.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No customizations added yet
                    </p>
                  ) : (
                    formData.customizations.map((customization, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2 p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex gap-2 flex-1">
                          <input
                            type="text"
                            value={customization.name}
                            onChange={(e) =>
                              handleCustomizationChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Option name (e.g., Oat Milk)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500">+$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={customization.price}
                              onChange={(e) =>
                                handleCustomizationChange(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <select
                            value={customization.category || "addons"}
                            onChange={(e) =>
                              handleCustomizationChange(
                                index,
                                "category",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-white"
                          >
                            {CUSTOMIZATION_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomization(index)}
                            className="text-red-500 hover:text-red-700 text-xl px-2"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Uploading...
                    </>
                  ) : editingItem ? (
                    "Save Changes"
                  ) : (
                    "Add Item"
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isUploading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items List */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryEmoji =
            category === "coffee"
              ? "☕"
              : category === "iced"
                ? "🧊"
                : category === "food"
                  ? "🍔"
                  : category === "tea"
                    ? "🍵"
                    : category === "pastry"
                      ? "🥐"
                      : "📦";

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{categoryEmoji}</span>
                <h4 className="text-xl font-bold capitalize text-gray-800">
                  {category}
                </h4>
                <span className="text-sm text-gray-500 ml-2">
                  (
                  {
                    menuItems.filter((item) => item.category === category)
                      .length
                  }{" "}
                  items)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div
                      key={item._id}
                      className={`relative rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                        item.available
                          ? "bg-white border-gray-200 hover:border-primary/40"
                          : "bg-gray-50 border-gray-300 opacity-80"
                      }`}
                    >
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {item.available ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full shadow-sm">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full shadow-sm">
                            Hidden
                          </span>
                        )}
                      </div>

                      <div className="flex">
                        {/* Product Image */}
                        <div className="w-28 h-28 flex-shrink-0 bg-gray-100">
                          <MenuItemImage
                            imageId={item.imageId}
                            legacyImage={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-gray-900 text-lg leading-tight truncate">
                              {item.name}
                            </h5>
                            <span className="text-lg font-bold text-primary flex-shrink-0">
                              ${item.basePrice.toFixed(2)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.sizes.map((s) => (
                              <span
                                key={s.name}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {s.name}
                                {s.priceModifier !== 0 && (
                                  <span className="ml-1 text-gray-400">
                                    {s.priceModifier > 0 ? "+" : ""}$
                                    {s.priceModifier.toFixed(2)}
                                  </span>
                                )}
                              </span>
                            ))}
                            {item.customizations.length > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">
                                +{item.customizations.length} options
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex border-t border-gray-100">
                        <button
                          onClick={() => handleToggleAvailable(item)}
                          className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                            item.available
                              ? "text-yellow-700 hover:bg-yellow-50"
                              : "text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {item.available ? (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                />
                              </svg>
                              Hide
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              Show
                            </>
                          )}
                        </button>
                        <div className="w-px bg-gray-100" />
                        <button
                          onClick={() => handleEditClick(item)}
                          className="flex-1 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl text-gray-500 mb-2">No menu items yet</p>
            <p className="text-gray-400">
              Click "Add New Item" to create your first product
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
