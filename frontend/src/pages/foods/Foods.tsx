import { Hamburger, Carrot, Cookie } from '@phosphor-icons/react'

// foods page component (placeholder)
const Foods = () => {
    const foodIcons = [Hamburger, Carrot, Cookie];

    return (
        <div className="py-12">
            <div className="nh-container">
                <h1 className="nh-title text-center mb-4">Foods Catalog</h1>
                <p className="nh-text text-center mb-12">
                    This is a placeholder for the Foods catalog page.
                    Implementation will come in the next phase.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(6).fill(null).map((_, index) => {
                        const IconComponent = foodIcons[index % foodIcons.length];
                        return (
                            <div key={index} className="nh-card p-4">
                                <div className="food-image-placeholder flex justify-center items-center">
                                    <IconComponent size={48} weight="fill" className="text-primary opacity-50" />
                                </div>
                                <div className="flex items-center mt-4">
                                    <div className="flex items-center justify-center mr-2">
                                        <IconComponent size={20} className="text-primary flex-shrink-0" />
                                    </div>
                                    <h3 className="nh-subtitle">Food Item {index + 1}</h3>
                                </div>
                                <p className="nh-text">Placeholder food description</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}

export default Foods 