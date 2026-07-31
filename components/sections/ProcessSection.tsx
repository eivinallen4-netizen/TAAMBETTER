'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import { motion } from 'motion/react';

interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

interface ProcessSectionProps {
  steps: ProcessStep[];
}

export default function ProcessSection({ steps }: ProcessSectionProps) {
  return (
    <section className="bg-black border-t border-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(244,99,37,.05)_25%,rgba(244,99,37,.05)_26%,transparent_27%,transparent_74%,rgba(244,99,37,.05)_75%,rgba(244,99,37,.05)_76%,transparent_77%,transparent)] bg-[length:60px_60px]" />

      <Container>
        <div className="py-14 md:py-16 relative z-10">
          <Title as="h2" color="white" className="mb-12">
            HOW WE WORK
          </Title>

          <div className="relative">
            <motion.div
              className="hidden lg:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-taam-orange/0 via-taam-orange/50 to-taam-orange/0"
              initial={{ scaleX: 0, transformOrigin: 'left' }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              viewport={{ once: true, amount: 0.3 }}
            />

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={{
                animate: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2,
                  },
                },
              }}
            >
              {steps.map((step, idx) => (
                <motion.div
                  key={step.step}
                  className="relative group"
                  whileHover={{ y: -5 }}
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
                  }}
                >
                  <div className="flex flex-col items-start">
                    <div className="relative mb-6 z-20">
                      <motion.div
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-taam-orange/20 to-taam-orange/10 border-2 border-taam-orange/40 flex items-center justify-center group-hover:border-taam-orange group-hover:from-taam-orange/30 group-hover:to-taam-orange/20 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-orange-500/30"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: idx * 0.15 + 0.3, duration: 0.5, ease: 'easeOut' }}
                        viewport={{ once: true, amount: 0.3 }}
                      >
                        <span className="text-2xl font-black text-taam-orange group-hover:scale-110 transition-transform">
                          {step.step}
                        </span>
                      </motion.div>
                      {idx < steps.length - 1 && (
                        <motion.div
                          className="hidden lg:block absolute top-8 -right-12 w-6 h-1 bg-gradient-to-r from-taam-orange to-transparent group-hover:from-taam-tint-2 transition"
                          initial={{ scaleX: 0, transformOrigin: 'left' }}
                          whileInView={{ scaleX: 1 }}
                          transition={{ delay: idx * 0.15 + 0.5, duration: 0.4, ease: 'easeOut' }}
                          viewport={{ once: true, amount: 0.3 }}
                        />
                      )}
                    </div>

                    <Title as="h3" color="white" className="text-xl mb-2">
                      {step.title}
                    </Title>
                    <Text size="sm" color="gray-400" className="leading-relaxed group-hover:text-gray-300 transition">
                      {step.description}
                    </Text>
                  </div>

                  <div className="absolute -inset-4 rounded-lg border border-taam-orange/0 group-hover:border-taam-orange/20 transition-all duration-300" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
