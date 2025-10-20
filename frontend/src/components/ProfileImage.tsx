import { User } from '@phosphor-icons/react';

interface ProfileImageProps {
    profileImage?: string | null;
    username: string;
    size?: 'sm' | 'md' | 'lg';
}

const ProfileImage = ({ profileImage, username, size = 'md' }: ProfileImageProps) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg'
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24
    };

    // If there's a profile image URL, display it
    if (profileImage) {
        return (
            <img
                src={profileImage}
                alt={`${username}'s profile`}
                className={`${sizeClasses[size]} rounded-full object-cover`}
            />
        );
    }

    // Otherwise, show a default user icon
    return (
        <div className={`${sizeClasses[size]} rounded-full bg-primary bg-opacity-10 flex items-center justify-center`}>
            <User size={iconSizes[size]} weight="fill" className="text-primary" />
        </div>
    );
};

export default ProfileImage;
