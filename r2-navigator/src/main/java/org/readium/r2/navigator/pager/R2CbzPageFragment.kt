/*
 * Module: r2-navigator-kotlin
 * Developers: Aferdita Muriqi, Mostapha Idoubihi
 *
 * Copyright (c) 2018. Readium Foundation. All rights reserved.
 * Use of this source code is governed by a BSD-style license which is detailed in the
 * LICENSE file present in the project repository where this source code is maintained.
 */

package org.readium.r2.navigator.pager

import android.graphics.BitmapFactory
import android.graphics.PointF
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.readium.r2.navigator.R
import org.readium.r2.navigator.R2BasicWebView
import org.readium.r2.navigator.image.ImageNavigatorFragment
import org.readium.r2.shared.publication.Link
import org.readium.r2.shared.publication.Publication
import kotlin.coroutines.CoroutineContext


class R2CbzPageFragment(
        private val publication: Publication,
        private val listener: ImageNavigatorFragment.Listener? = null)
    : androidx.fragment.app.Fragment(), CoroutineScope  {

    override val coroutineContext: CoroutineContext
        get() = Dispatchers.Main

    private val link: Link
        get() = requireArguments().getParcelable<Link>("link")!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {

        val view = inflater.inflate(R.layout.viewpager_fragment_cbz, container, false)
        val imageView = view.findViewById<ImageView>(R.id.imageView)

        val centerButton: Button = view.findViewById<View>(R.id.toggle) as Button
        centerButton.setOnClickListener {
            listener?.onTap(PointF((view.width / 2).toFloat(), (view.height / 2).toFloat()))
        }

        val leftButton: Button = view.findViewById<View>(R.id.left) as Button
        leftButton.setOnClickListener {
            listener?.onTap(PointF(1f, (view.height / 2).toFloat()))
        }

        val rightButton: Button = view.findViewById<View>(R.id.right) as Button
        rightButton.setOnClickListener {
            listener?.onTap(PointF((view.width - 1).toFloat(), (view.height / 2).toFloat()))
        }

       launch {
           publication.get(link)
               .read()
               .getOrNull()
               ?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
               ?.let { imageView.setImageBitmap(it) }
       }

       return view
    }

}


