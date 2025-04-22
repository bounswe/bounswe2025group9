// logo component with image and text
const Logo = ({ className = "" }) => {
    return (
        <div className={`flex items-center justify-center gap-0.5 ${className}`}>
            <img src="/src/assets/logo.png" alt="NutriHub Logo" className="w-12 h-12" />
            <h1 className="text-3xl text-white">
                <span className="font-light">Nutri</span>
                <span className="font-bold">Hub</span>
            </h1>
        </div>
    )
}

export default Logo 