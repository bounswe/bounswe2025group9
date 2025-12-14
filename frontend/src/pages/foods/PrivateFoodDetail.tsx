import React, { useState } from 'react';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import FoodDetail from './FoodDetail';
import { Food, apiClient } from '../../lib/apiClient';
import { useNavigate } from 'react-router-dom';

interface PrivateFoodDetailProps {
  food: Food | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

const PrivateFoodDetail: React.FC<PrivateFoodDetailProps> = ({
  food,
  open,
  onClose,
  onChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!food) return null;

  const handleDelete = async () => {
    if (!confirm(`Delete "${food.name}"? This action cannot be undone.`)) return;

    setLoading(true);
    try {
      await apiClient.deletePrivateFood(food.id);
      onChanged?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <FoodDetail
      food={food}
      open={open}
      onClose={onClose}
      actions={
        <>
          <button
            onClick={() => {
              navigate(`/foods/private/${food.id}/edit`);
            }
            }
            disabled={loading}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            title="Edit food"
          >
            <PencilSimple size={18} weight="bold" />
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
            title="Delete food"
          >
            <Trash size={18} weight="bold" />
          </button>
        </>
      }
    />
  );
};


export default PrivateFoodDetail;
