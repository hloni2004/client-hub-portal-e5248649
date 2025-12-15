import { useState } from 'react';
import { Star, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface ProductReviewDialogProps {
  productId: number;
  productName: string;
  canReview: boolean;
  onReviewSubmitted?: () => void;
}

export function ProductReviewDialog({
  productId,
  productName,
  canReview,
  onReviewSubmitted,
}: ProductReviewDialogProps) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('userId', user.userId.toString());
      formData.append('productId', productId.toString());
      formData.append('rating', rating.toString());
      formData.append('comment', comment);

      images.forEach((image) => {
        formData.append('images', image);
      });

      console.log('Submitting review with userId:', user.userId, 'productId:', productId);

      const response = await apiClient.post('/reviews/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Review submitted successfully!');
        setOpen(false);
        setRating(0);
        setComment('');
        setImages([]);
        setImagePreviews([]);
        onReviewSubmitted?.();
      } else {
        toast.error(response.data.message || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with {productName}
          </DialogDescription>
        </DialogHeader>

        {!canReview && user ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              You need to purchase this product before you can write a review.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : !user ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Please log in to write a review.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Your Rating *</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review *</Label>
            <Textarea
              id="comment"
              placeholder="Tell us about your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/1000
            </p>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Add Photos (Optional)</Label>
            <div className="flex flex-wrap gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-20 w-20 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              You can upload up to 5 images (JPG, PNG)
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
