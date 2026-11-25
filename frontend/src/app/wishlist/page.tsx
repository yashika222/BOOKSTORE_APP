'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Empty, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeFromWishlist } from '@/store/wishlistSlice';
import BookCoverImage from '@/components/books/BookCoverImage';
import { bookDetailsHref } from '@/lib/bookRoutes';
import { formatCurrency } from '@/lib/currency';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const handleRemove = (bookId: string | number) => {
    dispatch(removeFromWishlist(bookId));
    message.info('Removed from wishlist');
  };

  return (
    <main className="customer-page mx-auto box-border flex w-full max-w-[1022px] flex-1 flex-col px-4 pb-8 pt-[19px] sm:px-0">
      <nav
        aria-label="Breadcrumb"
        className="mb-[17px] text-[12px] leading-4 lg:ml-[2px]"
      >
        <Link href="/" className="text-[#9d9d9d] hover:text-[#a03037]">
          Home
        </Link>
        <span className="mx-1 text-[#9d9d9d]">/</span>
        <span className="text-[#0a0102]">My Wishlist</span>
      </nav>

      <section
        aria-labelledby="wishlist-heading"
        className="box-border w-full overflow-hidden border border-solid border-[#e4e4e4] bg-white lg:ml-[5px]"
      >
        <div className="box-border flex h-[54px] items-center border-x-0 border-b border-t-0 border-solid border-[#e4e4e4] bg-[#f5f5f5] px-[32px]">
          <h1
            id="wishlist-heading"
            className="m-0 translate-y-px text-[18px] font-medium leading-6 text-[#0a0102]"
          >
            My Wishlist ({String(wishlistItems.length).padStart(2, '0')})
          </h1>
        </div>

        {wishlistItems.length > 0 ? (
          <div>
            {wishlistItems.map((item, index) => {
              const detailsHref = bookDetailsHref(
                item.bookId,
                item.isCommercial ? 'store' : 'gutendex'
              );

              return (
                <article
                  key={String(item.bookId)}
                  className={`relative box-border flex items-start border-x-0 border-b border-t-0 border-solid border-[#e4e4e4] px-[35px] last:border-b-0 ${
                    index === 0
                      ? 'h-[171px] pb-[46px] pt-[39px]'
                      : index === 1
                        ? 'h-[183px] pb-[52px] pt-[46px]'
                        : 'min-h-[178px] pb-[52px] pt-[39px]'
                  }`}
                >
                  <Link
                    href={detailsHref}
                    aria-label={`View ${item.title}`}
                    className="mt-px flex h-[85px] w-[70px] shrink-0 items-center justify-center overflow-hidden"
                  >
                    <BookCoverImage
                      src={item.coverImage}
                      title={item.title}
                      author={item.author}
                      className="h-full w-full rounded-none object-contain p-0 shadow-none"
                    />
                  </Link>

                  <div className="ml-[33px] min-w-0 flex-1">
                    <Link
                      href={detailsHref}
                      title={item.title}
                      className="block truncate text-[18px] font-normal leading-6 text-[#0a0102] hover:text-[#a03037]"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-[5px] truncate text-[12px] leading-4 text-[#9d9d9d]">
                      by {item.author}
                    </p>
                    <div className="mt-[13px] flex items-center gap-[10px] leading-5">
                      {typeof item.price === 'number' && item.price > 0 ? (
                        <>
                          <span className="text-[15px] font-bold text-[#0a0102]">
                            {formatCurrency(item.price)}
                          </span>
                          {typeof item.originalPrice === 'number' &&
                            item.originalPrice > item.price && (
                              <s className="text-[12px] text-[#9d9d9d]">
                                {formatCurrency(item.originalPrice)}
                              </s>
                            )}
                        </>
                      ) : (
                        <span className="text-[12px] text-[#9d9d9d]">
                          Price unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  <Tooltip title="Remove from wishlist">
                    <button
                      type="button"
                      aria-label={`Remove ${item.title} from wishlist`}
                      onClick={() => handleRemove(item.bookId)}
                      className="ml-4 inline-flex h-[14px] w-4 shrink-0 items-center justify-center text-[12px] text-[#9d9d9d] transition-colors hover:text-[#a03037]"
                    >
                      <DeleteOutlined />
                    </button>
                  </Tooltip>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-[14px] text-[#666]">
                  Your wishlist is empty.
                </span>
              }
            >
              <Link href="/books">
                <Button type="primary" className="mt-2">
                  Discover Books
                </Button>
              </Link>
            </Empty>
          </div>
        )}
      </section>
    </main>
  );
}
