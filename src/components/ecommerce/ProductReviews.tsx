import { useEffect, useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Review {
  reviewId: number;
  user: {
    userId: number;
    firstName: string;
    lastName: string;
  };
  rating: number;
  comment: string;
  reviewDate: string;
  verified: boolean;
  helpfulCount: number;
  images?: Array<{
    imageId?: number;
    supabaseUrl?: string; // new Supabase public URL
    imageUrl?: string; // legacy URL
    imageData?: string; // legacy base64 data
    contentType?: string;
  }>;
} 

interface ProductReviewsProps {
  productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/reviews/product/${productId}`);
      const reviewsData = response.data?.data || [];
      setReviews(reviewsData);

      // Calculate average rating
      if (reviewsData.length > 0) {
        const avg =
          reviewsData.reduce((sum: number, r: Review) => sum + r.rating, 0) /
          reviewsData.length;
        setAverageRating(avg);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="border-b pb-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="text-sm text-muted-foreground">
            Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.reviewId} className="border-b pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {review.user.firstName[0]}
                    {review.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {review.user.firstName} {review.user.lastName}
                    </span>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified Purchase
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(review.reviewDate)}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed">{review.comment}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {review.images.map((image) => {
                        const src = image.supabaseUrl ?? image.imageUrl ?? (image.imageData ? `data:${image.contentType};base64,${image.imageData}` : undefined);
                        if (!src) return null;
                        return (
                          <img
                            key={(image.imageId ?? src).toString()}
                            src={src}
                            alt="Review"
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'; }}
                            className="h-20 w-20 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        );
                      })}
                    </div>
                  )} 

                  {review.helpfulCount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this helpful
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
