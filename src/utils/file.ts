/**
 * Converts a File object to a Data URL string.
 */
export const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Validates if a file is an image.
 */
export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
};

/**
 * Maximum file size for localStorage (approx 2MB for safe keeping)
 */
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export const isValidSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
};
