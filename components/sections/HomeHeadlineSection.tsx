'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import { motion } from 'motion/react';
import { slideInLeftScroll, slideInRightScroll } from '@/lib/motion-animations';
import { ParallaxLayer } from '../motion/ParallaxLayer';

interface HomeHeadlineSectionProps {
  headline: string;
  description: string;
}

export default function HomeHeadlineSection({ headline, description }: HomeHeadlineSectionProps) {
  return (
    <section className="relative bg-taam-orange overflow-hidden">
      <ParallaxLayer offset={0} speed={0.3}>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_30%,rgba(0,0,0,.03)_31%,rgba(0,0,0,.03)_32%,transparent_33%)] bg-[length:60px_60px]" />
      </ParallaxLayer>
      <ParallaxLayer offset={0} speed={0.5}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
      </ParallaxLayer>
      <ParallaxLayer offset={0} speed={0.4}>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl" />
      </ParallaxLayer>

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end py-14 md:py-16 relative z-10">
          <motion.div variants={slideInLeftScroll} initial="initial" whileInView="whileInView" viewport={{ once: false, amount: 0.3 }}>
            <Title as="h1" color="white" className="whitespace-pre-line">
              {headline}
            </Title>
          </motion.div>
          <motion.div variants={slideInRightScroll} initial="initial" whileInView="whileInView" viewport={{ once: false, amount: 0.3 }}>
            <Text size="lg" color="white" className="opacity-90 leading-relaxed">
              {description}
            </Text>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
