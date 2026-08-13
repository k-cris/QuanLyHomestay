import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Star, Search } from 'lucide-react';
import { homestayService } from '../services/api';

const Home = () => {
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchHomestays = async () => {
      setLoading(true);
      try {
        const queryParams = {};
        const city = searchParams.get('city');
        const minPrice = searchParams.get('minPrice');
        const keyword = searchParams.get('keyword');
        if (city) queryParams.city = city;
        if (minPrice) queryParams.minPrice = minPrice;
        if (keyword) queryParams.keyword = keyword;
        
        const res = await homestayService.getAll(queryParams);
        setHomestays(res.data);
      } catch (error) {
        console.error("Error fetching homestays", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomestays();
  }, [searchParams]);

  if (loading) return <div className="container page">Đang tải danh sách Homestay...</div>;

  return (
    <div className="container page">
      <div className="homestay-grid">
        {homestays.map(h => (
          <Link to={`/homestay/${h.id}`} key={h.id} className="homestay-card">
            <div className="homestay-img-wrapper">
              <img 
                src={h.images && h.images.length > 0 ? (typeof h.images[0] === 'string' ? h.images[0] : h.images[0].imageUrl) : 'https://placehold.co/600x400?text=No+Image'} 
                alt={h.title} 
                className="homestay-img" 
              />
            </div>
            <div className="homestay-info">
              <div className="homestay-title">
                <span>{h.city}</span>
                <span className="homestay-rating">
                  <Star size={14} fill="var(--color-text-dark)" color="var(--color-text-dark)" />
                  {h.averageRating}
                </span>
              </div>
              <div className="homestay-desc">{h.title}</div>
              <div className="homestay-price">
                {h.pricePerNight.toLocaleString('vi-VN')} ₫ <span style={{ fontWeight: 400 }}>đêm</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
