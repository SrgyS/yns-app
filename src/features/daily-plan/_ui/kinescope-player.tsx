// 'use client'

// import KinescopePlayer, {
//   PlayerPropsTypes
// } from "@kinescope/react-kinescope-player";

// type PlayerTypes = PlayerPropsTypes & {
//   forwardRef: any;
// };

// export default function Player({ forwardRef, ...props }: PlayerTypes) {
//   return <KinescopePlayer {...props} ref={forwardRef} />;
// }

'use client'

import dynamic from 'next/dynamic'
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react'

type KinescopeComponent =
  typeof import('@kinescope/react-kinescope-player').default
export type KinescopePlayerProps = ComponentPropsWithoutRef<KinescopeComponent>
export type PlayerHandle = ComponentRef<KinescopeComponent>

type ForwardedPlayerComponent = ForwardRefExoticComponent<
  KinescopePlayerProps & RefAttributes<PlayerHandle>
>

const RawPlayer = dynamic(() => import('@kinescope/react-kinescope-player'), {
  ssr: false,
}) as ForwardedPlayerComponent

export const KinescopePlayer = forwardRef<PlayerHandle, KinescopePlayerProps>(
  (props, ref) => <RawPlayer {...props} ref={ref} />
)

KinescopePlayer.displayName = 'KinescopePlayer'
