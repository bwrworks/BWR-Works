import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  name?: string
  type?: string
  image?: string
  url?: string
  schema?: Record<string, any>
}

export default function SEO({ 
  title, 
  description, 
  name = "BWR Works", 
  type = "website", 
  image, 
  url,
  schema
}: SEOProps) {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://www.bwrworks.com')

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name='description' content={description} />
      {/* Facebook tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:url" content={currentUrl} />
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  )
}
