import { Carousel } from '../components/atoms/Carousel';

const slides = [
  { bg: 'bg-primary-container', label: 'Slide 1' },
  { bg: 'bg-secondary-container', label: 'Slide 2' },
  { bg: 'bg-success-container', label: 'Slide 3' },
];

const CarouselDemo = () => {
  return (
    <div className="w-full max-w-md">
      <Carousel>
        {slides.map((slide) => (
          <div key={slide.label} className={`${slide.bg} rounded-card flex items-center justify-center h-48 text-title-md font-semibold`}>
            {slide.label}
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export const carouselStory = {
  component: CarouselDemo,
  name: 'Carousel',
  defaultProps: {
  },
  controls: [
  ],
};
