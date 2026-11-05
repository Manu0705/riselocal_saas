
import Image from 'next/image';
import Link from 'next/link';

interface SolutionCardProps {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
  category: string;
}

export default function SolutionCard({
  title,
  description,
  image,
  imageAlt,
  href,
  category,
}: SolutionCardProps) {
  return (
    <article className="solution-card">
      <Link href={href} className="solution-card-image-link">
        <div className="solution-card-image">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
            className="solution-card-photo"
          />

          <span className="solution-card-category">{category}</span>

          <span className="solution-card-image-arrow" aria-hidden="true">
            ↗
          </span>
        </div>
      </Link>

      <div className="solution-card-content">
        <h3>{title}</h3>
        <p>{description}</p>

        <Link href={href} className="solution-card-link">
          Explore solution
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
