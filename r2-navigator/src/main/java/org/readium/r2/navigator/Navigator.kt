package org.readium.r2.navigator

import kotlinx.coroutines.flow.Flow
import org.readium.r2.navigator.media.MediaPlayback
import kotlin.time.Duration
import kotlin.time.ExperimentalTime


/**
 * A navigator rendering an audio or video publication.
 */
@OptIn(ExperimentalTime::class)
interface MediaNavigator : Navigator {

  /**
   * Current playback information.
   */
  val playback: Flow<MediaPlayback>

  /**
   * Indicates whether the navigator is currently playing.
   */
  val isPlaying: Boolean

  /**
   * Sets the speed of the media playback.
   *
   * Normal speed is 1.0 and 0.0 is incorrect.
   */
  fun setPlaybackRate(rate: Double)

  /**
   * Resumes or start the playback at the current location.
   */
  fun play()

  /**
   * Pauses the playback.
   */
  fun pause()

  /**
   * Toggles the playback.
   * Can be useful as a handler for play/pause button.
   */
  fun playPause()

  /**
   * Stops the playback.
   *
   * Compared to [pause], the navigator may clear its state in whatever way is appropriate. For
   * example, recovering a player's resources.
   */
  fun stop()

  /**
   * Seeks to the given time in the current resource.
   */
  fun seekTo(position: Duration)

  /**
   * Seeks relatively from the current position in the current resource.
   */
  fun seekRelative(offset: Duration)

}
