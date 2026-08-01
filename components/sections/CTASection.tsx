'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Button from '../ui/Button';
import ContactCTA from '@/app/components/ContactCTA';
import { motion } from 'motion/react';
import { slideInDown, fadeIn, slideInUp, slideInLeft, slideInRight, slideInLeftScroll, slideInRightScroll } from '@/lib/motion-animations';
import { ParallaxLayer } from '../motion';

interface CTASectionProps {
  title: string;
  description?: string;
  email?: string;
  variant?: 'default' | 'work';
}

export default function CTASection({
  title,
  description,
  email,
  variant = 'default',
}: CTASectionProps) {
  if (variant === 'work') {
    return (
      <section className="relative bg-taam-orange py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_30%,rgba(0,0,0,.02)_31%,rgba(0,0,0,.02)_32%,transparent_33%)] bg-[length:60px_60px]" />
        <ParallaxLayer offset={0} speed={0.4}>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
        </ParallaxLayer>

        <Container>
          <div className="text-center relative z-10">
            <motion.div variants={slideInDown} initial="initial" animate="animate">
              <Title as="h2" color="white">
                {title}
              </Title>
            </motion.div>
            {description && (
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
              >
                <Text
                  size="base"
                  color="white"
                  className="text-black/80 max-w-2xl mx-auto mb-8 mt-4"
                >
                  {description}
                </Text>
              </motion.div>
            )}
            <motion.div
              variants={slideInUp}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.3 }}
            >
              <ContactCTA className="inline-block px-8 py-4 bg-black text-taam-orange font-black text-lg hover:bg-gray-900 transition relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-500 -translate-x-full" />
                <span className="relative">Get Free Recommendations</span>
              </ContactCTA>
            </motion.div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative bg-taam-orange py-16 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_30%,rgba(0,0,0,.02)_31%,rgba(0,0,0,.02)_32%,transparent_33%)] bg-[length:60px_60px]" />
      <ParallaxLayer offset={0} speed={0.3}>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
      </ParallaxLayer>

      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <motion.div variants={slideInLeftScroll} initial="initial" whileInView="whileInView" viewport={{ once: false, amount: 0.3 }}>
            <Title as="h2" color="white" className="text-center md:text-left">
              {title}
            </Title>
          </motion.div>
          <motion.div
            variants={slideInRightScroll}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: false, amount: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 shrink-0"
          >
            {email && (
              <a href={`mailto:${email}`} className="text-sm font-semibold text-black/80 hover:text-black transition">
                {email}
              </a>
            )}
            <ContactCTA className="inline-block px-8 py-4 bg-taam-near-black text-taam-orange font-black text-lg hover:bg-gray-900 transition relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-500 -translate-x-full" />
              <span className="relative">Get Free Recommendations</span>
            </ContactCTA>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
